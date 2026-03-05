import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const tenderSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  budget: z.number().positive('Budget must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  deadline: z.coerce.date().refine(
    (date) => date > new Date(),
    'Deadline must be in the future'
  ),
});

export const bidSchema = z.object({
  amount: z.number().positive('Bid amount must be positive'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type TenderFormData = z.infer<typeof tenderSchema>;
export type BidFormData = z.infer<typeof bidSchema>;
