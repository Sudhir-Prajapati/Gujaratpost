import { prisma } from '../config/prisma.js';
import { Role, AccountStatus, User } from '@prisma/client';

export class UserRepository {
  /**
   * Find a user by exact case-sensitive email address ("same to same").
   * Strictly verifies character-for-character match including capital/small letters.
   */
  static async findByEmailExact(email: string): Promise<User | null> {
    if (!email) return null;
    const typedEmail = email.trim();

    const candidates = await prisma.user.findMany({
      select: { id: true, email: true },
    });

    const match = candidates.find((c) => c.email === typedEmail);
    if (match) {
      return prisma.user.findUnique({
        where: { id: match.id },
      });
    }

    return null;
  }

  /**
   * Find a user by email address.
   */
  static async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const rawEmail = email.trim();

    // 1. Try normalized lowercase (standard)
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (user) return user;

    // 2. Try raw casing if different (in case an existing record had uppercase letters)
    if (rawEmail !== cleanEmail) {
      user = await prisma.user.findUnique({
        where: { email: rawEmail },
      });
      if (user) return user;
    }

    // 3. Fallback: find across users matching case-insensitively
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true },
    });
    const match = allUsers.find(
      (u) => u.email.trim().toLowerCase() === cleanEmail
    );
    if (match) {
      return prisma.user.findUnique({
        where: { id: match.id },
      });
    }

    return null;
  }

  /**
   * Find a user by their unique ID with optional author relation.
   */
  /**
   * Find a user by their unique ID with optional author relation.
   */
  static async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { author: true },
    });

    const writingRoles: Role[] = [Role.SUPER_ADMIN, Role.EDITOR, Role.REPORTER, Role.PHOTOGRAPHER];

    if (user && !user.author && writingRoles.includes(user.role)) {
      const nameFromEmail = user.email
        .split('@')[0]
        .split('.')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      const designation = 
        user.role === Role.EDITOR ? 'Senior Editor' :
        user.role === Role.SUPER_ADMIN ? 'Super Admin' :
        user.role === Role.PHOTOGRAPHER ? 'Staff Photographer' : 'Reporter';

      try {
        const newAuthor = await this.upsertAuthor(user.id, {
          name: nameFromEmail || 'Staff Writer',
          designation,
          bio: `${designation} covering news and current affairs for Gujarat Post.`,
        });
        user.author = newAuthor;
      } catch (e) {
        console.error(`Auto-creation of author profile failed for user ${user.id}:`, e);
      }
    }

    return user;
  }

  /**
   * Create a new user account.
   */
  static async createUser(data: {
    email: string;
    passwordHash: string;
    role?: Role;
    status?: AccountStatus;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.trim(),
        passwordHash: data.passwordHash,
        role: data.role,
        status: data.status,
      },
    });
  }

  /**
   * Update the first time login flag for a user.
   */
  static async updateFirstLoginStatus(
    userId: string,
    isFirstLogin: boolean,
    tx: any = prisma
  ): Promise<User> {
    return tx.user.update({
      where: { id: userId },
      data: { isFirstLogin },
    });
  }

  /**
   * Create an Author profile record, passing an optional transaction context.
   */
  static async createAuthorProfile(
    data: {
      userId: string;
      name: string;
      nameGu: string;
      nameHi: string;
      image: string;
      designation: string;
      designationGu: string;
      designationHi: string;
      bio: string;
      bioGu: string;
      bioHi: string;
    },
    tx: any = prisma
  ) {
    return tx.author.create({
      data,
    });
  }

  /**
   * Fetch all users in the system (excluding their password hashes).
   */
  static async findAll() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isFirstLogin: true,
        createdAt: true,
        updatedAt: true,
        author: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const writingRoles: Role[] = [Role.SUPER_ADMIN, Role.EDITOR, Role.REPORTER, Role.PHOTOGRAPHER];

    for (const user of users) {
      if (!user.author && writingRoles.includes(user.role)) {
        const nameFromEmail = user.email
          .split('@')[0]
          .split('.')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');

        const designation = 
          user.role === Role.EDITOR ? 'Senior Editor' :
          user.role === Role.SUPER_ADMIN ? 'Super Admin' :
          user.role === Role.PHOTOGRAPHER ? 'Staff Photographer' : 'Reporter';

        try {
          const newAuthor = await this.upsertAuthor(user.id, {
            name: nameFromEmail || 'Staff Writer',
            designation,
            bio: `${designation} covering news and current affairs for Gujarat Post.`,
          });
          user.author = newAuthor;
        } catch (e) {
          console.error(`Auto-creation of author profile failed for user ${user.id}:`, e);
        }
      }
    }

    return users;
  }

  /**
   * Update a user's details.
   */
  static async update(
    id: string,
    data: {
      email?: string;
      passwordHash?: string;
      role?: Role;
      status?: AccountStatus;
    }
  ) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isFirstLogin: true,
        createdAt: true,
        updatedAt: true,
        author: true,
      },
    });
  }

  /**
   * Upsert an author profile for a user.
   */
  static async upsertAuthor(
    userId: string,
    authorData: {
      name: string;
      nameGu?: string;
      nameHi?: string;
      image?: string;
      designation: string;
      designationGu?: string;
      designationHi?: string;
      bio?: string;
      bioGu?: string;
      bioHi?: string;
    }
  ) {
    const payload = {
      name: authorData.name,
      nameGu: authorData.nameGu || authorData.name,
      nameHi: authorData.nameHi || authorData.name,
      image: authorData.image || '',
      designation: authorData.designation,
      designationGu: authorData.designationGu || authorData.designation,
      designationHi: authorData.designationHi || authorData.designation,
      bio: authorData.bio || '',
      bioGu: authorData.bioGu || authorData.bio || '',
      bioHi: authorData.bioHi || authorData.bio || '',
    };

    return prisma.author.upsert({
      where: { userId },
      create: {
        userId,
        ...payload,
      },
      update: payload,
    });
  }

  /**
   * Delete a user.
   */
  static async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
