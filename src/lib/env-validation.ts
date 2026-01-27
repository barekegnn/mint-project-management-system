/**
 * Environment Variable Validation Utility
 * 
 * This utility validates that all required environment variables are present
 * and properly configured before the application starts.
 */

export interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;
  
  // Authentication
  JWT_SECRET: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  
  // Email/SMTP
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM: string;
  EMAIL_USER: string;
  EMAIL_PASSWORD: string;
  
  // File Storage (optional)
  BLOB_READ_WRITE_TOKEN?: string;
  
  // Feature Flags
  ENABLE_UPLOADS: boolean;
  ENABLE_EMAIL: boolean;
  
  // Environment
  NODE_ENV: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that all required environment variables are present
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
  ];

  // Check for missing required variables
  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL) {
    if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
      errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
    }
    if (!process.env.DATABASE_URL.includes('sslmode=require')) {
      warnings.push('DATABASE_URL should include sslmode=require for production');
    }
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters for security');
  }

  // Validate NEXTAUTH_SECRET length
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    warnings.push('NEXTAUTH_SECRET should be at least 32 characters for security');
  }

  // Validate SMTP_PORT is a number
  if (process.env.SMTP_PORT && isNaN(Number(process.env.SMTP_PORT))) {
    errors.push('SMTP_PORT must be a valid number');
  }

  // Validate email configuration
  if (process.env.SMTP_USER && !process.env.SMTP_USER.includes('@')) {
    errors.push('SMTP_USER must be a valid email address');
  }

  // Check for file upload configuration
  if (process.env.ENABLE_UPLOADS === 'true' && !process.env.BLOB_READ_WRITE_TOKEN) {
    warnings.push('ENABLE_UPLOADS is true but BLOB_READ_WRITE_TOKEN is not set');
  }

  // Check for development secrets in production
  if (process.env.NODE_ENV === 'production') {
    const devSecrets = ['your-secret', 'your-jwt-secret', 'your-nextauth-secret'];
    
    for (const secret of devSecrets) {
      if (process.env.JWT_SECRET?.includes(secret) || 
          process.env.NEXTAUTH_SECRET?.includes(secret)) {
        errors.push('Production environment is using development secrets! Generate new secrets.');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gets the validated environment configuration
 * Throws an error if validation fails
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const validation = validateEnvironment();

  if (!validation.valid) {
    console.error('❌ Environment validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Invalid environment configuration. Check your .env file.');
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    SMTP_HOST: process.env.SMTP_HOST!,
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '465'),
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER!,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD!,
    SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER!,
    EMAIL_USER: process.env.EMAIL_USER || process.env.SMTP_USER!,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD!,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    ENABLE_UPLOADS: process.env.ENABLE_UPLOADS === 'true',
    ENABLE_EMAIL: process.env.ENABLE_EMAIL !== 'false',
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

/**
 * Validates environment on application startup
 * Call this in your root layout or middleware
 */
export function validateEnvironmentOnStartup(): void {
  if (typeof window === 'undefined') {
    // Only run on server-side
    const validation = validateEnvironment();
    
    if (!validation.valid) {
      console.error('\n❌ Environment validation failed!\n');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      console.error('\nPlease check your .env file and ensure all required variables are set.');
      console.error('See .env.example for reference.\n');
      process.exit(1);
    }

    if (validation.warnings.length > 0) {
      console.warn('\n⚠️  Environment validation warnings:\n');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
      console.warn('');
    }

    console.log('✅ Environment validation passed');
  }
}
