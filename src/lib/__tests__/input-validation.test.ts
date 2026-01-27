/**
 * Property-Based Tests for Input Validation
 * 
 * Property 3: Input Validation on All API Endpoints
 * Validates: Requirements US-2.6
 * 
 * This test verifies that all API endpoints properly validate user input
 * using Zod schemas and return appropriate error messages for invalid data.
 */

import {
  loginSchema,
  createUserSchema,
  createProjectSchema,
  createTaskSchema,
  updateTaskSchema,
  emailSchema,
  passwordSchema,
} from '../validation-schemas';
import { ZodError } from 'zod';

describe('Property 3: Input Validation on All API Endpoints', () => {
  describe('Email validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'admin+tag@company.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
      ];

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow(ZodError);
      });
    });
  });

  describe('Password validation', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'Password123',
        'SecureP@ss1',
        'MyP4ssw0rd',
        'Test1234Pass',
      ];

      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });
    });

    it('should reject passwords without uppercase letters', () => {
      expect(() => passwordSchema.parse('password123')).toThrow(ZodError);
    });

    it('should reject passwords without lowercase letters', () => {
      expect(() => passwordSchema.parse('PASSWORD123')).toThrow(ZodError);
    });

    it('should reject passwords without numbers', () => {
      expect(() => passwordSchema.parse('PasswordOnly')).toThrow(ZodError);
    });

    it('should reject passwords shorter than 8 characters', () => {
      expect(() => passwordSchema.parse('Pass1')).toThrow(ZodError);
    });
  });

  describe('Login schema validation', () => {
    it('should accept valid login data', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'anypassword',
      };

      expect(() => loginSchema.parse(validLogin)).not.toThrow();
    });

    it('should reject login without email', () => {
      const invalidLogin = {
        password: 'password123',
      };

      expect(() => loginSchema.parse(invalidLogin)).toThrow(ZodError);
    });

    it('should reject login without password', () => {
      const invalidLogin = {
        email: 'user@example.com',
      };

      expect(() => loginSchema.parse(invalidLogin)).toThrow(ZodError);
    });

    it('should reject login with invalid email format', () => {
      const invalidLogin = {
        email: 'notanemail',
        password: 'password123',
      };

      expect(() => loginSchema.parse(invalidLogin)).toThrow(ZodError);
    });
  });

  describe('User creation schema validation', () => {
    it('should accept valid user creation data', () => {
      const validUser = {
        fullName: 'John Doe',
        email: 'john@example.com',
        role: 'TEAM_MEMBER' as const,
      };

      expect(() => createUserSchema.parse(validUser)).not.toThrow();
    });

    it('should reject user creation without required fields', () => {
      const invalidUsers = [
        { email: 'john@example.com', role: 'TEAM_MEMBER' }, // missing fullName
        { fullName: 'John Doe', role: 'TEAM_MEMBER' }, // missing email
        { fullName: 'John Doe', email: 'john@example.com' }, // missing role
      ];

      invalidUsers.forEach(user => {
        expect(() => createUserSchema.parse(user)).toThrow(ZodError);
      });
    });

    it('should reject user creation with invalid role', () => {
      const invalidUser = {
        fullName: 'John Doe',
        email: 'john@example.com',
        role: 'INVALID_ROLE',
      };

      expect(() => createUserSchema.parse(invalidUser)).toThrow(ZodError);
    });

    it('should reject user creation with short name', () => {
      const invalidUser = {
        fullName: 'J',
        email: 'john@example.com',
        role: 'TEAM_MEMBER',
      };

      expect(() => createUserSchema.parse(invalidUser)).toThrow(ZodError);
    });
  });

  describe('Project creation schema validation', () => {
    it('should accept valid project creation data', () => {
      const validProject = {
        name: 'New Project',
        description: 'Project description',
        budget: '10000',
        holderId: 'clx1234567890',
        status: 'PLANNED' as const,
      };

      expect(() => createProjectSchema.parse(validProject)).not.toThrow();
    });

    it('should accept project creation with minimal required fields', () => {
      const minimalProject = {
        name: 'New Project',
      };

      expect(() => createProjectSchema.parse(minimalProject)).not.toThrow();
    });

    it('should reject project with short name', () => {
      const invalidProject = {
        name: 'AB',
      };

      expect(() => createProjectSchema.parse(invalidProject)).toThrow(ZodError);
    });

    it('should reject project with invalid status', () => {
      const invalidProject = {
        name: 'New Project',
        status: 'INVALID_STATUS',
      };

      expect(() => createProjectSchema.parse(invalidProject)).toThrow(ZodError);
    });
  });

  describe('Task creation schema validation', () => {
    it('should accept valid task creation data', () => {
      const validTask = {
        title: 'New Task',
        description: 'Task description',
        projectId: 'clx1234567890',
        assignedToId: 'clx0987654321',
        priority: 'HIGH' as const,
        status: 'TODO' as const,
        deadline: new Date('2026-12-31'),
      };

      expect(() => createTaskSchema.parse(validTask)).not.toThrow();
    });

    it('should accept task creation with minimal required fields', () => {
      const minimalTask = {
        title: 'New Task',
        projectId: 'clx1234567890',
      };

      expect(() => createTaskSchema.parse(minimalTask)).not.toThrow();
    });

    it('should reject task without title', () => {
      const invalidTask = {
        projectId: 'clx1234567890',
      };

      expect(() => createTaskSchema.parse(invalidTask)).toThrow(ZodError);
    });

    it('should reject task without projectId', () => {
      const invalidTask = {
        title: 'New Task',
      };

      expect(() => createTaskSchema.parse(invalidTask)).toThrow(ZodError);
    });

    it('should reject task with short title', () => {
      const invalidTask = {
        title: 'AB',
        projectId: 'clx1234567890',
      };

      expect(() => createTaskSchema.parse(invalidTask)).toThrow(ZodError);
    });

    it('should reject task with invalid priority', () => {
      const invalidTask = {
        title: 'New Task',
        projectId: 'clx1234567890',
        priority: 'INVALID_PRIORITY',
      };

      expect(() => createTaskSchema.parse(invalidTask)).toThrow(ZodError);
    });

    it('should reject task with invalid status', () => {
      const invalidTask = {
        title: 'New Task',
        projectId: 'clx1234567890',
        status: 'INVALID_STATUS',
      };

      expect(() => createTaskSchema.parse(invalidTask)).toThrow(ZodError);
    });
  });

  describe('Task update schema validation', () => {
    it('should accept valid task update data', () => {
      const validUpdate = {
        title: 'Updated Task',
        description: 'Updated description',
        priority: 'URGENT' as const,
        status: 'IN_PROGRESS' as const,
      };

      expect(() => updateTaskSchema.parse(validUpdate)).not.toThrow();
    });

    it('should accept partial task updates', () => {
      const partialUpdates = [
        { title: 'Updated Title' },
        { status: 'COMPLETED' as const },
        { priority: 'LOW' as const },
        { description: 'New description' },
      ];

      partialUpdates.forEach(update => {
        expect(() => updateTaskSchema.parse(update)).not.toThrow();
      });
    });

    it('should reject task update with invalid fields', () => {
      const invalidUpdates = [
        { title: 'AB' }, // too short
        { status: 'INVALID_STATUS' },
        { priority: 'INVALID_PRIORITY' },
      ];

      invalidUpdates.forEach(update => {
        expect(() => updateTaskSchema.parse(update)).toThrow(ZodError);
      });
    });
  });

  describe('Property: All validation errors include descriptive messages', () => {
    it('should provide clear error messages for validation failures', () => {
      try {
        loginSchema.parse({ email: 'invalid', password: '' });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        const zodError = error as ZodError;
        expect(zodError.errors.length).toBeGreaterThan(0);
        expect(zodError.errors[0].message).toBeTruthy();
      }
    });

    it('should provide field-specific error messages', () => {
      try {
        createUserSchema.parse({
          fullName: 'J',
          email: 'invalid',
          role: 'INVALID',
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        const zodError = error as ZodError;
        
        // Should have errors for multiple fields
        expect(zodError.errors.length).toBeGreaterThan(0);
        
        // Each error should have a path and message
        zodError.errors.forEach(err => {
          expect(err.path).toBeDefined();
          expect(err.message).toBeTruthy();
        });
      }
    });
  });

  describe('Property: Validation schemas are consistent across the application', () => {
    it('should use the same email validation everywhere', () => {
      const testEmail = 'test@example.com';
      
      // Email should be valid in all schemas that use it
      expect(() => emailSchema.parse(testEmail)).not.toThrow();
      expect(() => loginSchema.parse({ email: testEmail, password: 'pass' })).not.toThrow();
      expect(() => createUserSchema.parse({ 
        fullName: 'Test User', 
        email: testEmail, 
        role: 'TEAM_MEMBER' 
      })).not.toThrow();
    });

    it('should consistently reject invalid data types', () => {
      const invalidInputs = [
        { schema: loginSchema, data: { email: 123, password: 'pass' } },
        { schema: createUserSchema, data: { fullName: 123, email: 'test@example.com', role: 'ADMIN' } },
        { schema: createProjectSchema, data: { name: 123 } },
      ];

      invalidInputs.forEach(({ schema, data }) => {
        expect(() => schema.parse(data)).toThrow(ZodError);
      });
    });
  });
});
