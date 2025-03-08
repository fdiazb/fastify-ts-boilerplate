import bcrypt from 'bcrypt';
import type { User, LoginCredentials, RegistrationData } from '../../types';

// In a real application, this would be a database
// For this example, we'll use an in-memory store
const users: Map<string, User> = new Map();

// Crear usuario predefinido (admin/123)
(async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123', salt);
  
  const adminUser: User = {
    id: 'admin-id',
    username: 'admin',
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  users.set(adminUser.id, adminUser);
  console.log('Usuario predefinido creado: admin (contraseña: 123)');
})();

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegistrationData): Promise<User | null> {
    // Check if passwords match
    if (data.password !== data.confirmPassword) {
      return null;
    }

    // Check if username already exists
    if (Array.from(users.values()).some(user => user.username === data.username)) {
      return null;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create user
    const user: User = {
      id: crypto.randomUUID(),
      username: data.username,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save user
    users.set(user.id, user);

    return user;
  }

  /**
   * Login a user
   */
  async login(credentials: LoginCredentials): Promise<User | null> {
    // Find user by username
    const user = Array.from(users.values()).find(
      user => user.username === credentials.username
    );

    // Check if user exists
    if (!user) {
      return null;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return users.get(id) || null;
  }
}
