import { prisma } from "@/server/database/prisma";
import { UserRepository } from "@/server/repositories/user.repository";
import { hashPassword } from "@/server/auth/password";
import { ConflictError, ValidationError } from "@/server/utils/errors";
import { CreateUserSchema, UpdateUserSchema } from "@/server/validators/user.validator";

export const UserManagementService = {
  async createUser(data: CreateUserSchema) {
    const { email, password, role, status, authorProfile } = data;

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("A user with this email already exists");
    }

    return prisma.$transaction(async (tx) => {
      let authorId: string | null = null;

      if (authorProfile) {
        // Verify author email is not in use by another active author
        const existingAuthor = await tx.author.findFirst({
          where: { email: email, deletedAt: null }
        });
        if (existingAuthor) {
          throw new ConflictError("An author profile with this email already exists");
        }

        const author = await tx.author.create({
          data: {
            name: authorProfile.name,
            nameGu: authorProfile.nameGu,
            nameHi: authorProfile.nameHi,
            image: authorProfile.image || "",
            designation: authorProfile.designation,
            designationGu: authorProfile.designationGu,
            designationHi: authorProfile.designationHi,
            bio: authorProfile.bio || "",
            bioGu: authorProfile.bioGu || "",
            bioHi: authorProfile.bioHi || "",
            email: email,
            twitter: authorProfile.twitter || null,
            facebook: authorProfile.facebook || null,
            instagram: authorProfile.instagram || null,
            linkedin: authorProfile.linkedin || null,
            isActive: true,
          }
        });
        authorId = author.id;
      }

      const passwordHash = await hashPassword(password);
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role,
          status,
          authorId,
        },
        include: {
          author: true,
        }
      });

      return user;
    });
  },

  async updateUser(id: string, data: UpdateUserSchema) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new ValidationError("User not found");
    }

    const { email, password, role, status, authorProfile } = data;

    if (email && email !== user.email) {
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        throw new ConflictError("A user with this email already exists");
      }
    }

    return prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (status) updateData.status = status;
      if (password) {
        updateData.passwordHash = await hashPassword(password);
      }

      let authorId = user.authorId;

      if (authorProfile) {
        if (authorId) {
          await tx.author.update({
            where: { id: authorId },
            data: {
              name: authorProfile.name,
              nameGu: authorProfile.nameGu,
              nameHi: authorProfile.nameHi,
              image: authorProfile.image || "",
              designation: authorProfile.designation,
              designationGu: authorProfile.designationGu,
              designationHi: authorProfile.designationHi,
              bio: authorProfile.bio || "",
              bioGu: authorProfile.bioGu || "",
              bioHi: authorProfile.bioHi || "",
              email: email || user.email,
              twitter: authorProfile.twitter || null,
              facebook: authorProfile.facebook || null,
              instagram: authorProfile.instagram || null,
              linkedin: authorProfile.linkedin || null,
            }
          });
        } else {
          const authorEmail = email || user.email;
          const existingAuthor = await tx.author.findFirst({
            where: { email: authorEmail, deletedAt: null }
          });
          if (existingAuthor) {
            throw new ConflictError("An author profile with this email already exists");
          }

          const author = await tx.author.create({
            data: {
              name: authorProfile.name,
              nameGu: authorProfile.nameGu,
              nameHi: authorProfile.nameHi,
              image: authorProfile.image || "",
              designation: authorProfile.designation,
              designationGu: authorProfile.designationGu,
              designationHi: authorProfile.designationHi,
              bio: authorProfile.bio || "",
              bioGu: authorProfile.bioGu || "",
              bioHi: authorProfile.bioHi || "",
              email: authorEmail,
              twitter: authorProfile.twitter || null,
              facebook: authorProfile.facebook || null,
              instagram: authorProfile.instagram || null,
              linkedin: authorProfile.linkedin || null,
              isActive: true,
            }
          });
          authorId = author.id;
          updateData.authorId = authorId;
        }
      } else if (authorProfile === null && authorId) {
        updateData.authorId = null;
        await tx.author.update({
          where: { id: authorId },
          data: { isActive: false, deletedAt: new Date() }
        });
      }

      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
        include: {
          author: true,
        }
      });

      return updatedUser;
    });
  },

  async deleteUser(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new ValidationError("User not found");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Revoke active sessions
      await tx.session.deleteMany({
        where: { userId: id }
      });

      // 2. Set status to DELETED
      const deletedUser = await tx.user.update({
        where: { id },
        data: {
          status: "DELETED",
          authorId: null, // decouple
        }
      });

      // 3. Soft delete linked author profile
      if (user.authorId) {
        await tx.author.update({
          where: { id: user.authorId },
          data: {
            isActive: false,
            deletedAt: new Date()
          }
        });
      }

      return deletedUser;
    });
  }
};
