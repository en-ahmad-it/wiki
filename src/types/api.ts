// Types for the wiki application API

export interface Article {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  imageUrl?: string;
}

// Note: User types will come from Stack Auth SDK
// No need to define custom User interface

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface FileUploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  message?: string;
}
