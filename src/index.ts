import Fastify from 'fastify';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import fastifyFormBody from '@fastify/formbody';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyFlash from '@fastify/flash';
import nunjucks from 'nunjucks';
import { join } from 'path';
import crypto from 'crypto';

// Import modules
import { authRoutes } from './modules/auth';
import { privateRoutes } from './modules/private';
import { publicRoutes } from './modules/public';

// Create Fastify instance
const fastify = Fastify({
  logger: true
});

// Register view engine
fastify.register(fastifyView, {
  engine: {
    nunjucks
  },
  root: join(__dirname, 'views'),
  viewExt: 'njk',
  options: {
    onConfigure: (env: nunjucks.Environment) => {
      // Agregar global para obtener la fecha actual
      env.addGlobal('now', () => new Date());
      
      // Agregar filtro de fecha personalizado
      env.addFilter('date', function(date: string | Date, format?: string) {
        if (!date) return '';
        
        const d = new Date(date);
        
        // Formato básico por defecto: DD/MM/YYYY
        if (!format) {
          return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        }
        
        // Formatos personalizados
        return format
          .replace('YYYY', d.getFullYear().toString())
          .replace('MM', (d.getMonth() + 1).toString().padStart(2, '0'))
          .replace('DD', d.getDate().toString().padStart(2, '0'))
          .replace('HH', d.getHours().toString().padStart(2, '0'))
          .replace('mm', d.getMinutes().toString().padStart(2, '0'))
          .replace('ss', d.getSeconds().toString().padStart(2, '0'))
          .replace('MMMM', new Intl.DateTimeFormat('es', { month: 'long' }).format(d));
      });
      
      return env;
    }
  }
});

// Register static file handler
fastify.register(fastifyStatic, {
  root: join(__dirname, 'public'),
  prefix: '/public/'
});

// Register form body parser
fastify.register(fastifyFormBody);

// Register cookie handler
fastify.register(fastifyCookie);

// Register session handler
fastify.register(fastifySession, {
  cookieName: 'sessionId',
  secret: process.env.SESSION_SECRET || 'a-very-secret-key-that-should-be-changed-in-production',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
  }
});

// Register flash messages
fastify.register(fastifyFlash);

// Implementación personalizada de CSRF
fastify.decorateRequest('csrfToken', function() {
  // @ts-ignore - session es añadido por el plugin fastify-session
  if (!this.session.csrfSecret) {
    // @ts-ignore - session es añadido por el plugin fastify-session
    this.session.csrfSecret = crypto.randomBytes(16).toString('hex');
  }
  
  // @ts-ignore - session es añadido por el plugin fastify-session
  const secret = this.session.csrfSecret;
  // Generar un nuevo token CSRF usando HMAC
  return crypto.createHmac('sha256', secret).update('csrf-token').digest('hex');
});

// Hook para validar tokens CSRF en POST, PUT, DELETE
fastify.addHook('preHandler', (request, reply, done) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return done();
  }
  
  // Obtener token de la solicitud (de los campos del formulario o encabezados)
  // @ts-ignore - body pasa a través del plugin fastify-formbody
  const formToken = request.body?._csrf;
  const headerToken = request.headers['csrf-token'] as string;
  const token = formToken || headerToken;
  
  // Validar que haya un token
  if (!token) {
    return reply.code(403).send({ error: 'CSRF token missing' });
  }
  
  // Calcular el token esperado
  // @ts-ignore - csrfToken es el método que acabamos de agregar
  const expectedToken = request.csrfToken();
  
  // Validar el token
  if (token !== expectedToken) {
    return reply.code(403).send({ error: 'CSRF token invalid' });
  }
  
  done();
});

// Add authentication check decorator
fastify.decorateRequest('isAuthenticated', false);

// Authentication hook
fastify.addHook('preHandler', (request, reply, done) => {
  // @ts-ignore - session is added by the fastify-session plugin
  request.isAuthenticated = request.session.userId !== undefined;
  done();
});

// Register routes
fastify.register(publicRoutes, { prefix: '/' });
fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(privateRoutes, { prefix: '/private' });

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
