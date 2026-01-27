#!/usr/bin/env node

/**
 * Generate Secure Secrets for Environment Variables
 * 
 * This script generates cryptographically secure random secrets
 * for JWT_SECRET and NEXTAUTH_SECRET.
 * 
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generating secure secrets for your .env file...\n');
console.log('Copy these values to your .env file:\n');
console.log('─'.repeat(60));

// Generate JWT_SECRET (32 bytes = 256 bits)
const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log('\nJWT_SECRET:');
console.log(jwtSecret);

// Generate NEXTAUTH_SECRET (32 bytes = 256 bits)
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log('\nNEXTAUTH_SECRET:');
console.log(nextAuthSecret);

console.log('\n' + '─'.repeat(60));
console.log('\n✅ Secrets generated successfully!');
console.log('\n⚠️  IMPORTANT:');
console.log('  - Copy these secrets to your .env file');
console.log('  - NEVER commit these secrets to git');
console.log('  - Use different secrets for each environment');
console.log('  - Keep production secrets secure\n');
