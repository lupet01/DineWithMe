// User domain types
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// API response types
export interface UserResponse {
  id: string;
  email: string;
  createdAt: string;
}
