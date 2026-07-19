/**
 * Connection (Mutual Interest) types
 */

export interface Connection {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  dinnerId: string;
  dinnerTheme: string | null;
  dinnerDate: string;
  createdAt: string;
}

export interface ConnectionsResponse {
  success: boolean;
  data?: {
    connections: Connection[];
    count: number;
  };
  error?: {
    message: string;
    code: string;
  };
}
