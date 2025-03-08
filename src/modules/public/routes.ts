import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function publicRoutes(fastify: FastifyInstance) {
  // Home page
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.view('public/index', { 
      title: 'Home',
      isAuthenticated: request.isAuthenticated,
      // @ts-ignore - session is added by the fastify-session plugin
      username: request.session?.username
    });
  });

  // About page
  fastify.get('/about', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.view('public/about', { 
      title: 'About',
      isAuthenticated: request.isAuthenticated,
      // @ts-ignore - session is added by the fastify-session plugin
      username: request.session?.username
    });
  });
}
