import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Request microphone permissions
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted');
      } catch (err) {
        console.error('Microphone permission denied:', err);
        alert('Please allow microphone access to use this application.');
      }
    };
    
    checkMicrophonePermission();
  }, []);
  
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const newRecording = {
          id: Date.now(),
          url: audioUrl,
          blob: audioBlob,
          timestamp: new Date().toLocaleString(),
          transcription: ''
        };
        
        setRecordings(prev => [...prev, newRecording]);
        processRecording(newRecording);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Error accessing microphone. Please check permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  const processRecording = async (recording) => {
    setIsProcessing(true);
    try {
      // Here you would send the audio to your backend for processing
      // For now, let's simulate a backend call with a timeout
      setTimeout(() => {
        const dummyTranscription = "This is a simulated transcription of the conversation.";
        
        setTranscription(dummyTranscription);
        setRecordings(prevRecordings => 
          prevRecordings.map(rec => 
            rec.id === recording.id 
              ? { ...rec, transcription: dummyTranscription } 
              : rec
          )
        );
        setIsProcessing(false);
      }, 2000);
      
      // Real implementation would look something like this:
      /*
      const formData = new FormData();
      formData.append('audio', recording.blob, 'recording.wav');
      
      const response = await fetch('http://localhost:8000/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }
      
      const data = await response.json();
      setTranscription(data.transcription);
      setRecordings(prevRecordings => 
        prevRecordings.map(rec => 
          rec.id === recording.id 
            ? { ...rec, transcription: data.transcription } 
            : rec
        )
      );
      */
    } catch (error) {
      console.error('Error processing recording:', error);
      setIsProcessing(false);
    }
  };
  
  const deleteRecording = (id) => {
    setRecordings(prev => prev.filter(recording => recording.id !== id));
  };
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Conversation Recorder</h1>
      </header>
      
      <main className="app-main">
        <div className="recorder-section">
          <div className="control-panel">
            <button 
              className={`record-button ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            
            {isRecording && (
              <div className="recording-indicator">
                Recording in progress...
              </div>
            )}
          </div>
          
          {isProcessing && (
            <div className="processing-indicator">
              Processing audio... Please wait.
            </div>
          )}
          
          {transcription && (
            <div className="transcription-section">
              <h3>Latest Transcription</h3>
              <div className="transcription-text">
                {transcription}
              </div>
            </div>
          )}
        </div>
        
        <div className="recordings-section">
          <h2>Recordings</h2>
          {recordings.length === 0 ? (
            <p>No recordings yet. Click "Start Recording" to begin.</p>
          ) : (
            <ul className="recordings-list">
              {recordings.map(recording => (
                <li key={recording.id} className="recording-item">
                  <div className="recording-details">
                    <span className="recording-timestamp">{recording.timestamp}</span>
                    <audio controls src={recording.url}></audio>
                  </div>
                  
                  {recording.transcription && (
                    <div className="recording-transcription">
                      <h4>Transcription</h4>
                      <p>{recording.transcription}</p>
                    </div>
                  )}
                  
                  <div className="recording-actions">
                    <button 
                      className="delete-button" 
                      onClick={() => deleteRecording(recording.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
