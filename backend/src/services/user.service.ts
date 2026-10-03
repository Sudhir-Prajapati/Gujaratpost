import { UserRepository } from '../repositories/user.repository.js';
import { hashPassword } from '../utils/bcrypt.js';
import { sendCredentialsEmail } from '../utils/mail.js';
import { ConflictError } from '../utils/errors.js';
import { Role, AccountStatus } from '@prisma/client';

export interface CreateUserParams {
  email: string;
  password?: string; // Optional if you auto-generate, but here the super admin supplies it
  role: Role;
  status?: AccountStatus;
}

export class UserService {
  /**
   * Create a new user profile and email them their credentials.
   */
  static async createUser(params: CreateUserParams) {
    const { email, password, role, status = AccountStatus.ACTIVE } = params;

    if (!password) {
      throw new Error('Password is required for creating a new user account.');
    }

    const cleanEmail = email.trim();

    // 1. Check if email is already registered
    const existingUser = await UserRepository.findByEmail(cleanEmail);
    if (existingUser) {
      throw new ConflictError('A user account with this email address already exists.');
    }

    // 2. Hash the user's password
    const hashed = await hashPassword(password);

    // 3. Save the user in the database
    const user = await UserRepository.createUser({
      email: cleanEmail,
      passwordHash: hashed,
      role,
      status,
    });

    // 4. Send the credentials to the user via Resend (fire-and-forget style to avoid blocking the DB response)
    // We run it asynchronously and handle inner exceptions to avoid interrupting the success API response
    sendCredentialsEmail(cleanEmail, password, role).catch((error) => {
      console.error(`Post-user-creation mail delivery failed for ${cleanEmail}:`, error);
    });

    // 5. Return sanitized user metadata
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
