import axios from 'axios';
import { ApiResponse, Conversation, ConversationRequest } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const response = await apiClient.post<ApiResponse<Conversation>>('/api/conversations', data);
    return response.data;
  },

  async uploadConversationAudio(id: string, audioBlob: Blob): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    const response = await apiClient.post<ApiResponse<any>>(`/api/conversations/${id}/audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteConversation(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/conversations/${id}`);
    return response.data;
  }
};
