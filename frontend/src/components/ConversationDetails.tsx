import React from 'react';
import { Paper, Typography, Box, Divider, Chip } from '@mui/material';
import { format } from 'date-fns';
import { Conversation } from '../types.ts';

interface ConversationDetailProps {
  conversation: Conversation | null;
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversation }) => {
  if (!conversation) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="textSecondary">Select a conversation to view details</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>{conversation.title}</Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="textSecondary">
          {format(new Date(conversation.created_at), 'MMMM d, yyyy • h:mm a')}
        </Typography>
        <Chip 
          label={`${Math.floor(conversation.duration / 60)}:${String(conversation.duration % 60).padStart(2, '0')}`} 
          size="small" 
          sx={{ ml: 2 }}
        />
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {conversation.content}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ConversationDetail;
