import axios from 'axios';
import { ApiResponse, Conversation, ConversationRequest } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

console.log('API_BASE_URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request/response interceptors for debugging
apiClient.interceptors.request.use(request => {
  console.log('API Request:', { 
    url: request.url, 
    method: request.method, 
    headers: request.headers,
    data: request.data 
  });
  return request;
});

apiClient.interceptors.response.use(
  response => {
    console.log('API Response Success:', { 
      url: response.config.url, 
      status: response.status, 
      data: response.data 
    });
    return response;
  },
  error => {
    console.error('API Response Error:', { 
      url: error.config?.url, 
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const conversationService = {
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    const response = await apiClient.get<ApiResponse<Conversation[]>>('/api/conversations');
    return response.data;
  },

  async getConversation(id: string): Promise<ApiResponse<Conversation>> {
    const response = await apiClient.get<ApiResponse<Conversation>>(`/api/conversations/${id}`);
    return response.data;
  },

  async createConversation(data: ConversationRequest): Promise<ApiResponse<Conversation>> {
    console.log('Creating conversation with data:', data);
    const response = await apiClient.post<ApiResponse<Conversation>>('/api/conversations', data);
    return response.data;
  },

  async uploadConversationAudio(id: string, audioBlob: Blob): Promise<ApiResponse<any>> {
    console.log(`Uploading audio for conversation ${id}, blob size: ${audioBlob.size} bytes`);
    console.log('Blob type:', audioBlob.type);
    
    const formData = new FormData();
    formData.append('audio_file', audioBlob);
    
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/api/conversations/${id}/audio`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error in uploadConversationAudio:', error);
      throw error;
    }
  },

  async deleteConversation(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/conversations/${id}`);
    return response.data;
  }
};
