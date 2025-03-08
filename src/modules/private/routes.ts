import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../auth/service';

const authService = new AuthService();

// Authentication middleware
async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.isAuthenticated) {
    return reply.redirect('/auth/login');
  }
}

export async function privateRoutes(fastify: FastifyInstance) {
  // Apply authentication middleware to all routes in this plugin
  fastify.addHook('preHandler', requireAuth);

  // Dashboard page
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore - session is added by the fastify-session plugin
    const userId = request.session.userId;
    const user = await authService.getUserById(userId);

    return reply.view('private/dashboard', { 
      title: 'Dashboard',
      isAuthenticated: true,
      // @ts-ignore - session is added by the fastify-session plugin
      username: request.session?.username || 'User',
      user
    });
  });

  // Profile page
  fastify.get('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore - session is added by the fastify-session plugin
    const userId = request.session.userId;
    const user = await authService.getUserById(userId);

    return reply.view('private/profile', { 
      title: 'Profile',
      isAuthenticated: true,
      // @ts-ignore - session is added by the fastify-session plugin
      username: request.session?.username || 'User',
      user
    });
  });
}
