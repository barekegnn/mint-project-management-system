/**
 * Test Database Connection Script
 * 
 * This script tests the connection to the Neon PostgreSQL database
 * and verifies that connection pooling is working correctly.
 * 
 * Usage: node scripts/test-db-connection.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔍 Testing Neon database connection...\n');

  try {
    // Test 1: Basic connection test
    console.log('Test 1: Basic connection test');
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as result`;
    const latency = Date.now() - startTime;
    console.log(`✅ Connection successful! Latency: ${latency}ms\n`);

    // Test 2: Check database version
    console.log('Test 2: Database version check');
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log(`✅ PostgreSQL version: ${version[0].version.split(' ')[0]} ${version[0].version.split(' ')[1]}\n`);

    // Test 3: Check connection pool settings
    console.log('Test 3: Connection pool settings');
    const poolSettings = await prisma.$queryRaw`
      SELECT name, setting 
      FROM pg_settings 
      WHERE name IN ('max_connections', 'shared_buffers', 'effective_cache_size')
    `;
    console.log('✅ Pool settings:');
    poolSettings.forEach(setting => {
      console.log(`   - ${setting.name}: ${setting.setting}`);
    });
    console.log('');

    // Test 4: Check if we're using PgBouncer
    console.log('Test 4: PgBouncer detection');
    const databaseUrl = process.env.DATABASE_URL || '';
    const isPgBouncer = databaseUrl.includes('pgbouncer=true');
    const isPooler = databaseUrl.includes('-pooler.');
    console.log(`✅ Using PgBouncer: ${isPgBouncer ? 'Yes' : 'No'}`);
    console.log(`✅ Using pooler endpoint: ${isPooler ? 'Yes' : 'No'}\n`);

    // Test 5: Test query performance
    console.log('Test 5: Query performance test');
    const queryStart = Date.now();
    const userCount = await prisma.user.count();
    const queryLatency = Date.now() - queryStart;
    console.log(`✅ User count query: ${userCount} users (${queryLatency}ms)\n`);

    // Test 6: Multiple concurrent queries (test pooling)
    console.log('Test 6: Concurrent query test (testing connection pooling)');
    const concurrentStart = Date.now();
    await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.$queryRaw`SELECT 1`,
      prisma.$queryRaw`SELECT 2`,
    ]);
    const concurrentLatency = Date.now() - concurrentStart;
    console.log(`✅ 5 concurrent queries completed in ${concurrentLatency}ms\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ All database connection tests passed!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Database: Neon PostgreSQL`);
    console.log(`Connection pooling: ${isPgBouncer ? 'Enabled (PgBouncer)' : 'Disabled'}`);
    console.log(`Average latency: ${latency}ms`);
    console.log(`Connection URL: ${databaseUrl.split('@')[1]?.split('?')[0] || 'hidden'}`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Database connection test failed!\n');
    if (error instanceof Error) {
      console.error('Error:', error.message);
      console.error('\nStack trace:', error.stack);
    } else {
      console.error('Error:', error);
    }
    console.error('\n💡 Troubleshooting tips:');
    console.error('1. Check that DATABASE_URL is set correctly in .env');
    console.error('2. Verify your Neon database is active (not paused)');
    console.error('3. Check that your IP is allowed (Neon allows all by default)');
    console.error('4. Ensure the connection string includes sslmode=require');
    console.error('5. For serverless, use the pooled connection string with pgbouncer=true\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConnection()
  .then(() => {
    console.log('✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
