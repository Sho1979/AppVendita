export interface User {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'manager';
  salesPoints: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: 'agent' | 'manager';
  salesPoints: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'agent' | 'manager';
  salesPoints?: string[];
}
