import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { hashPassword } from '../utils/bcrypt.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError } from '../utils/errors.js';
import { Role, AccountStatus } from '@prisma/client';

export class UserController {
  /**
   * Endpoint to create a new user profile by a SUPER_ADMIN.
   */
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, role, status, authorProfile } = req.body;

      // 1. Basic validation
      if (!email || typeof email !== 'string') {
        throw new BadRequestError('Email address is required.');
      }

      if (!password || typeof password !== 'string') {
        throw new BadRequestError('A default password is required.');
      }

      // Password strength validation
      if (password.length < 8) {
        throw new BadRequestError('Password must be at least 8 characters long.');
      }
      if (!/[a-z]/.test(password)) {
        throw new BadRequestError('Password must contain at least one lowercase letter.');
      }
      if (!/[A-Z]/.test(password)) {
        throw new BadRequestError('Password must contain at least one uppercase letter.');
      }
      if (!/[0-9]/.test(password)) {
        throw new BadRequestError('Password must contain at least one numeric digit.');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new BadRequestError('Password must contain at least one special character (e.g., !@#$%^&*).');
      }

      if (!role || !Object.values(Role).includes(role)) {
        throw new BadRequestError(`Invalid role. Valid roles are: ${Object.values(Role).join(', ')}.`);
      }

      const accountStatus = status && Object.values(AccountStatus).includes(status) 
        ? (status as AccountStatus) 
        : AccountStatus.ACTIVE;

      // 2. Call user creation service
      const user = await UserService.createUser({
        email: email.trim().toLowerCase(),
        password,
        role: role as Role,
        status: accountStatus,
      });

      if (authorProfile && typeof authorProfile === 'object' && authorProfile.name) {
        await UserRepository.upsertAuthor(user.id, authorProfile);
      }

      return sendSuccess(res, { user }, 'User account created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch list of all user accounts.
   */
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserRepository.findAll();
      return sendSuccess(res, { users }, 'Users list retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detail of a specific user.
   */
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserRepository.findById(id);
      if (!user) {
        throw new BadRequestError('User account not found.');
      }
      // sanitize
      const { passwordHash, ...sanitized } = user;
      return sendSuccess(res, { user: sanitized }, 'User profile retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper: count active Super Admins in the database.
   */
  private static async countActiveSuperAdmins(): Promise<number> {
    const all = await UserRepository.findAll();
    return all.filter(
      (u) => u.role === Role.SUPER_ADMIN && u.status === AccountStatus.ACTIVE
    ).length;
  }

  /**
   * Update details of an existing user.
   */
  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { email, password, role, status, authorProfile } = req.body;

      const dataToUpdate: any = {};

      if (email && typeof email === 'string') {
        dataToUpdate.email = email.trim().toLowerCase();
      }

      if (password && typeof password === 'string') {
        if (password.length < 8) {
          throw new BadRequestError('Password must be at least 8 characters long.');
        }
        if (!/[a-z]/.test(password)) {
          throw new BadRequestError('Password must contain at least one lowercase letter.');
        }
        if (!/[A-Z]/.test(password)) {
          throw new BadRequestError('Password must contain at least one uppercase letter.');
        }
        if (!/[0-9]/.test(password)) {
          throw new BadRequestError('Password must contain at least one numeric digit.');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          throw new BadRequestError('Password must contain at least one special character (e.g., !@#$%^&*).');
        }
        dataToUpdate.passwordHash = await hashPassword(password);
      }

      // --- Super Admin Protection ---
      if (status || role) {
        const targetUser = await UserRepository.findById(id);
        if (targetUser && targetUser.role === Role.SUPER_ADMIN) {
          const isSuspending = status && status !== AccountStatus.ACTIVE;
          const isDemoting = role && role !== Role.SUPER_ADMIN;

          // Super Admin accounts are permanently protected and cannot be suspended
          if (isSuspending) {
            throw new BadRequestError('Super Admin accounts are protected and cannot be suspended.');
          }

          // A Super Admin can only be demoted if there is at least one other active Super Admin
          if (isDemoting) {
            const activeSuperAdminCount = await UserController.countActiveSuperAdmins();
            if (activeSuperAdminCount <= 1) {
              throw new BadRequestError(
                'Cannot demote the last active Super Admin. Please promote another user to Super Admin first.'
              );
            }
          }
        }

        // Prevent self-suspension
        if (status && status !== AccountStatus.ACTIVE && req.user?.userId === id) {
          throw new BadRequestError('You cannot suspend your own account.');
        }
      }
      // --- End Protection ---

      if (role && Object.values(Role).includes(role)) {
        dataToUpdate.role = role as Role;
      }

      if (status && Object.values(AccountStatus).includes(status)) {
        dataToUpdate.status = status as AccountStatus;
      }

      const updatedUser = await UserRepository.update(id, dataToUpdate);

      if (authorProfile && typeof authorProfile === 'object' && authorProfile.name) {
        await UserRepository.upsertAuthor(id, authorProfile);
      }

      const finalUser = await UserRepository.findById(id);
      if (finalUser) {
        const { passwordHash, ...sanitized } = finalUser;
        return sendSuccess(res, { user: sanitized }, 'User account updated successfully.');
      }

      return sendSuccess(res, { user: updatedUser }, 'User account updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a user account.
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (req.user?.userId === id) {
        throw new BadRequestError('Self-deletion is not permitted.');
      }

      // --- Super Admin Protection ---
      const targetUser = await UserRepository.findById(id);
      if (targetUser && targetUser.role === Role.SUPER_ADMIN) {
        throw new BadRequestError(
          'Super Admin accounts are permanently protected and cannot be deleted.'
        );
      }
      // --- End Protection ---

      await UserRepository.delete(id);
      return sendSuccess(res, null, 'User account deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}
