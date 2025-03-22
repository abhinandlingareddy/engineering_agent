export interface Conversation {
  id: string;
  title: string;
  content: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationRequest {
  title: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
