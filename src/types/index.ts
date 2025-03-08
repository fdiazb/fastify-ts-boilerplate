import { FastifyRequest, FastifyReply } from 'fastify';

// Extend FastifyRequest to include our custom properties
declare module 'fastify' {
  interface FastifyRequest {
    isAuthenticated: boolean;
  }
  
  interface Session {
    userId?: string;
    username?: string;
  }
}

// User model
export interface User {
  id: string;
  username: string;
  password: string; // This will be the hashed password
  createdAt: Date;
  updatedAt: Date;
}

// Login credentials
export interface LoginCredentials {
  username: string;
  password: string;
}

// Registration data
export interface RegistrationData extends LoginCredentials {
  confirmPassword: string;
}
