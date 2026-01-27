/**
 * Zod Validation Schemas
 * 
 * Centralized validation schemas for API request validation
 */

import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const idSchema = z.string().cuid('Invalid ID format');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const dateSchema = z.coerce.date();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// ============================================
// Authentication Schemas
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER']).optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const activateAccountSchema = z.object({
  token: z.string().min(1, 'Activation token is required'),
  password: passwordSchema,
});

// ============================================
// User Schemas
// ============================================

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: emailSchema,
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER']),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: emailSchema.optional(),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER']).optional(),
  status: z.enum(['PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED']).optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: emailSchema.optional(),
});

// ============================================
// Project Schemas
// ============================================

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  budget: z.string().optional(),
  dueDate: dateSchema.optional(),
  holderId: idSchema.optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'CANCELLED', 'COMPLETED', 'IN_PROGRESS', 'ON_HOLD']).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  budget: z.string().optional(),
  dueDate: dateSchema.optional(),
  holderId: idSchema.optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'CANCELLED', 'COMPLETED', 'IN_PROGRESS', 'ON_HOLD']).optional(),
});

export const assignProjectManagerSchema = z.object({
  holderId: idSchema,
});

// ============================================
// Task Schemas
// ============================================

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters'),
  description: z.string().optional(),
  projectId: idSchema,
  assignedToId: idSchema.optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED']).default('TODO'),
  deadline: dateSchema.optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  assignedToId: idSchema.optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED']).optional(),
  deadline: dateSchema.optional(),
});

export const assignTaskSchema = z.object({
  assignedToId: idSchema,
});

// ============================================
// Team Schemas
// ============================================

export const createTeamSchema = z.object({
  name: z.string().min(3, 'Team name must be at least 3 characters'),
  memberIds: z.array(idSchema).optional(),
  projectIds: z.array(uuidSchema).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(3).optional(),
});

export const addTeamMemberSchema = z.object({
  userId: idSchema,
});

export const removeTeamMemberSchema = z.object({
  userId: idSchema,
});

// ============================================
// Budget Schemas
// ============================================

export const createBudgetSchema = z.object({
  projectId: uuidSchema,
  department: z.string().min(2, 'Department name is required'),
  date: dateSchema,
  allocation: z.number().positive('Allocation must be positive'),
  expenses: z.number().nonnegative('Expenses cannot be negative'),
  status: z.enum(['Pending', 'Approved', 'Rejected']).default('Pending'),
});

export const updateBudgetSchema = z.object({
  department: z.string().min(2).optional(),
  date: dateSchema.optional(),
  allocation: z.number().positive().optional(),
  expenses: z.number().nonnegative().optional(),
  status: z.enum(['Pending', 'Approved', 'Rejected']).optional(),
});

// ============================================
// Report Schemas
// ============================================

export const createReportSchema = z.object({
  title: z.string().min(3, 'Report title must be at least 3 characters'),
  description: z.string().optional(),
  recipientId: idSchema,
  taskId: idSchema.optional(),
  fileUrl: z.string().url('Invalid file URL'),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
});

export const reviewReportSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  feedback: z.string().optional(),
});

// ============================================
// Comment Schemas
// ============================================

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  taskId: idSchema,
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
});

// ============================================
// Notification Schemas
// ============================================

export const createNotificationSchema = z.object({
  type: z.enum([
    'PROJECT_CREATED',
    'PROJECT_UPDATED',
    'PROJECT_DELETED',
    'PROJECT_STATUS_CHANGED',
    'PROJECT_ASSIGNED',
    'TASK_CREATED',
    'TASK_UPDATED',
    'TASK_DELETED',
    'TASK_STATUS_CHANGED',
    'TASK_ASSIGNED',
  ]),
  message: z.string().min(1, 'Message is required'),
  userId: idSchema,
  projectId: uuidSchema,
});

export const markNotificationReadSchema = z.object({
  notificationId: uuidSchema,
});

// ============================================
// Message Schemas
// ============================================

export const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  recipientId: idSchema,
});

// ============================================
// Settings Schemas
// ============================================

export const updateSettingsSchema = z.object({
  settings: z.record(z.any()),
});

// ============================================
// File Upload Schemas
// ============================================

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']),
});

// ============================================
// Query Parameter Schemas
// ============================================

export const projectQuerySchema = z.object({
  status: z.enum(['PLANNED', 'ACTIVE', 'CANCELLED', 'COMPLETED', 'IN_PROGRESS', 'ON_HOLD']).optional(),
  holderId: idSchema.optional(),
  search: z.string().optional(),
  ...paginationSchema.shape,
});

export const taskQuerySchema = z.object({
  projectId: uuidSchema.optional(),
  assignedToId: idSchema.optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  search: z.string().optional(),
  ...paginationSchema.shape,
});

export const userQuerySchema = z.object({
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER']).optional(),
  status: z.enum(['PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED']).optional(),
  search: z.string().optional(),
  ...paginationSchema.shape,
});

// ============================================
// Helper Functions
// ============================================

/**
 * Validate request body against a schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validate query parameters against a schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, params: URLSearchParams): T {
  const data = Object.fromEntries(params.entries());
  return schema.parse(data);
}

/**
 * Safe validation that returns errors instead of throwing
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown) {
  return schema.safeParse(data);
}
