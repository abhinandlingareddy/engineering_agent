import React, { useState, useEffect } from 'react';
import { List, ListItem, ListItemText, ListItemButton, IconButton, Typography, Paper, Box, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { Conversation } from '../types.ts';
import { conversationService } from '../services/api.ts';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  refreshTrigger?: number;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  onSelectConversation,
  refreshTrigger = 0 
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await conversationService.getConversations();
      setConversations(response.data);
    } catch (err) {
      setError('Failed to load conversations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [refreshTrigger]);

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await conversationService.deleteConversation(id);
      setConversations(conversations.filter(conv => conv.id !== id));
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading && conversations.length === 0) {
    return <Typography align="center">Loading conversations...</Typography>;
  }

  if (error) {
    return <Typography color="error" align="center">{error}</Typography>;
  }

  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Conversation History</Typography>
        {conversations.length === 0 ? (
          <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
            No conversations recorded yet
          </Typography>
        ) : (
          <List>
            {conversations.map((conversation, index) => (
              <React.Fragment key={conversation.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem 
                  disablePadding
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={(e) => handleDelete(conversation.id, e)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={() => onSelectConversation(conversation)}>
                    <ListItemText
                      primary={conversation.title}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="textSecondary">
                            {format(new Date(conversation.created_at), 'MMM d, yyyy • h:mm a')}
                          </Typography>
                          <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                            • {formatDuration(conversation.duration)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default ConversationList;
