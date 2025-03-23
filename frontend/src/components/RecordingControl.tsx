import React, { useState, useRef } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { conversationService } from '../services/api.ts';

interface RecordingControlProps {
  onRecordingComplete: (conversationId: string) => void;
}

const RecordingControl: React.FC<RecordingControlProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [conversationTitle, setConversationTitle] = useState("New Conversation");

  const startRecording = async () => {
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        
        try {
          // Create a new conversation
          const response = await conversationService.createConversation({
            title: conversationTitle,
          });
          
          // Upload the recorded audio
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await conversationService.uploadConversationAudio(response.data.id, audioBlob);
          
          // Notify parent component
          onRecordingComplete(response.data.id);
        } catch (error) {
          console.error('Failed to save recording:', error);
        } finally {
          setIsProcessing(false);
          setRecordingTime(0);
          setIsRecording(false);
        }

        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start(1000);
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
      <Typography variant="h6">
        {isRecording ? 'Recording in Progress' : 'Ready to Record'}
      </Typography>
      
      {isRecording && (
        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography variant="h4" color="error">
            {formatTime(recordingTime)}
          </Typography>
        </Box>
      )}
      
      {isProcessing ? (
        <CircularProgress />
      ) : (
        <Button
          variant="contained"
          color={isRecording ? 'error' : 'primary'}
          startIcon={isRecording ? <StopIcon /> : <MicIcon />}
          onClick={isRecording ? stopRecording : startRecording}
          sx={{ mt: 2 }}
          size="large"
        >
          {isRecording ? 'Stop' : 'Start Recording'}
        </Button>
      )}
    </Box>
  );
};

export default RecordingControl;
