// Generic API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// API error structure
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
