# Conversation Recorder

An application for recording conversations, converting speech to text, and storing the transcriptions. Built with React, Python/FastAPI, and Azure services.

## Features

- Record audio conversations through the browser
- Transcribe speech to text using Azure Speech Services
- Store conversations in a database with their transcriptions
- Browse and manage conversation history
- View detailed transcriptions of past conversations

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI for styling
- Axios for API calls
- React Router for navigation

### Backend
- FastAPI (Python)
- Pydantic for data validation
- SQLAlchemy for ORM
- Azure Speech Services for speech-to-text
- Azure Blob Storage for storing audio files

## Setup Instructions

### Prerequisites
- Node.js 14+ and npm
- Python 3.8+
- Task (taskfile.dev) - optional but recommended

### Environment Variables

Create a `.env` file in the `backend` directory with:

