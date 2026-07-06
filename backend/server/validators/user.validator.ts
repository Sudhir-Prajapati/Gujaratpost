import { z } from "zod";

const AuthorProfileSchema = z.object({
  name: z.string().min(1, "Name in English is required"),
  nameGu: z.string().min(1, "Name in Gujarati is required"),
  nameHi: z.string().min(1, "Name in Hindi is required"),
  image: z.string().default(""),
  designation: z.string().min(1, "Designation in English is required"),
  designationGu: z.string().min(1, "Designation in Gujarati is required"),
  designationHi: z.string().min(1, "Designation in Hindi is required"),
  bio: z.string().default(""),
  bioGu: z.string().default(""),
  bioHi: z.string().default(""),
  twitter: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
});

export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum([
    "SUPER_ADMIN",
    "EDITOR",
    "REPORTER",
    "SEO",
    "ADVERTISEMENT",
    "PHOTOGRAPHER",
  ]),
  status: z.enum([
    "ACTIVE",
    "SUSPENDED",
    "DELETED",
    "PENDING_VERIFICATION",
  ]).default("ACTIVE"),
  authorProfile: AuthorProfileSchema.optional().nullable(),
});

export type CreateUserSchema = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional()
    .or(z.literal("")),
  role: z.enum([
    "SUPER_ADMIN",
    "EDITOR",
    "REPORTER",
    "SEO",
    "ADVERTISEMENT",
    "PHOTOGRAPHER",
  ]).optional(),
  status: z.enum([
    "ACTIVE",
    "SUSPENDED",
    "DELETED",
    "PENDING_VERIFICATION",
  ]).optional(),
  authorProfile: AuthorProfileSchema.optional().nullable(),
});

export type UpdateUserSchema = z.infer<typeof UpdateUserSchema>;
