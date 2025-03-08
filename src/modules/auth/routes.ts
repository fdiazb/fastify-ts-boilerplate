import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './service';
import type { LoginCredentials, RegistrationData } from '../../types';

// Extend FastifyRequest to include csrfToken method
declare module 'fastify' {
  interface FastifyRequest {
    csrfToken(): string;
  }
}

const authService = new AuthService();

export async function authRoutes(fastify: FastifyInstance) {
  // Login page
  fastify.get('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    // If already logged in, redirect to private area
    if (request.isAuthenticated) {
      return reply.redirect('/private');
    }

    return reply.view('auth/login', { 
      title: 'Login',
      csrf: request.csrfToken(),
      errorMessage: null
    });
  });

  // Login handler
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const credentials = request.body as LoginCredentials;
    
    // Validate input
    if (!credentials.username || !credentials.password) {
      return reply.view('auth/login', {
        title: 'Login',
        csrf: request.csrfToken(),
        errorMessage: 'Username and password are required'
      });
    }

    // Attempt login
    const user = await authService.login(credentials);
    
    if (!user) {
      return reply.view('auth/login', {
        title: 'Login',
        csrf: request.csrfToken(),
        errorMessage: 'Invalid username or password'
      });
    }

    // Set session
    // @ts-ignore - session is added by the fastify-session plugin
    request.session.userId = user.id;
    // @ts-ignore - session is added by the fastify-session plugin
    request.session.username = user.username;
    
    return reply.redirect('/private');
  });

  // Register page
  fastify.get('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    // If already logged in, redirect to private area
    if (request.isAuthenticated) {
      return reply.redirect('/private');
    }

    return reply.view('auth/register', { 
      title: 'Register',
      csrf: request.csrfToken(),
      errorMessage: null
    });
  });

  // Register handler
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const registrationData = request.body as RegistrationData;
    
    // Validate input
    if (!registrationData.username || !registrationData.password || !registrationData.confirmPassword) {
      return reply.view('auth/register', {
        title: 'Register',
        csrf: request.csrfToken(),
        errorMessage: 'All fields are required'
      });
    }

    if (registrationData.password !== registrationData.confirmPassword) {
      return reply.view('auth/register', {
        title: 'Register',
        csrf: request.csrfToken(),
        errorMessage: 'Passwords do not match'
      });
    }

    // Attempt registration
    const user = await authService.register(registrationData);
    
    if (!user) {
      return reply.view('auth/register', {
        title: 'Register',
        csrf: request.csrfToken(),
        errorMessage: 'Username already exists'
      });
    }

    // Set session
    // @ts-ignore - session is added by the fastify-session plugin
    request.session.userId = user.id;
    // @ts-ignore - session is added by the fastify-session plugin
    request.session.username = user.username;
    
    return reply.redirect('/private');
  });

  // Logout handler
  fastify.get('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore - session is added by the fastify-session plugin
    request.session.destroy();
    return reply.redirect('/');
  });
}
