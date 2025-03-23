import React, { useState } from 'react';
import { Container, Grid, CssBaseline, AppBar, Toolbar, Typography, Box, ThemeProvider, createTheme } from '@mui/material';
import RecordingControl from './components/RecordingControl.tsx';
import { Conversation } from './types.ts';
import ConversationList from './components/ConversationsList.tsx';
import ConversationDetails from './components/ConversationDetails.tsx';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0078d4', // Azure blue
    },
    secondary: {
      main: '#ffb900', // Azure gold
    },
  },
});

function App() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRecordingComplete = (conversationId: string) => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            Conversation Recorder
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 3 }}>
          <RecordingControl onRecordingComplete={handleRecordingComplete} />
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <ConversationList 
              onSelectConversation={setSelectedConversation} 
              refreshTrigger={refreshTrigger} 
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <ConversationDetails conversation={selectedConversation} />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default App;
