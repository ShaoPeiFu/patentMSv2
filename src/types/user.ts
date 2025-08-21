export interface User {
  id: number;
  username: string;
  email: string;
  realName: string;
  phone?: string;
  department: string;
  role: "user" | "admin" | "reviewer";
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  realName: string;
  phone?: string;
  department: string;
  role?: string;
  agreeTerms: boolean;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}
