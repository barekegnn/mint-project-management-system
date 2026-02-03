/**
 * Test Authentication Error Messages
 * 
 * This script tests the authentication system to ensure it returns
 * appropriate error messages for various invalid credential scenarios.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuthError(testName, credentials, expectedStatus, expectedMessagePattern) {
  try {
    log(`\n🧪 Testing: ${testName}`, 'cyan');
    log(`   Credentials: ${JSON.stringify(credentials)}`, 'blue');

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    
    log(`   Status: ${response.status}`, response.status === expectedStatus ? 'green' : 'red');
    log(`   Response: ${JSON.stringify(data)}`, 'blue');

    // Check status code
    if (response.status !== expectedStatus) {
      log(`   ❌ FAIL: Expected status ${expectedStatus}, got ${response.status}`, 'red');
      return false;
    }

    // Check error message
    const errorMessage = data.message || data.error || '';
    const messageMatches = expectedMessagePattern.test(errorMessage);
    
    if (messageMatches) {
      log(`   ✅ PASS: Error message is appropriate: "${errorMessage}"`, 'green');
      return true;
    } else {
      log(`   ❌ FAIL: Error message doesn't match expected pattern`, 'red');
      log(`   Expected pattern: ${expectedMessagePattern}`, 'yellow');
      log(`   Got: "${errorMessage}"`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`   ❌ ERROR: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n' + '='.repeat(70), 'cyan');
  log('  AUTHENTICATION ERROR MESSAGE TESTING', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  const tests = [
    {
      name: 'Invalid email format',
      credentials: { email: 'notanemail', password: 'Password123' },
      expectedStatus: 400,
      expectedPattern: /invalid.*email/i,
    },
    {
      name: 'Missing email',
      credentials: { password: 'Password123' },
      expectedStatus: 400,
      expectedPattern: /email.*required/i,
    },
    {
      name: 'Missing password',
      credentials: { email: 'test@example.com' },
      expectedStatus: 400,
      expectedPattern: /password.*required/i,
    },
    {
      name: 'Non-existent user',
      credentials: { email: 'nonexistent@example.com', password: 'Password123' },
      expectedStatus: 401,
      expectedPattern: /invalid.*email.*password/i,
    },
    {
      name: 'Wrong password for existing user',
      credentials: { email: 'admin@example.com', password: 'WrongPassword123' },
      expectedStatus: 401,
      expectedPattern: /invalid.*email.*password/i,
    },
    {
      name: 'Empty email',
      credentials: { email: '', password: 'Password123' },
      expectedStatus: 400,
      expectedPattern: /email.*required/i,
    },
    {
      name: 'Empty password',
      credentials: { email: 'test@example.com', password: '' },
      expectedStatus: 400,
      expectedPattern: /password.*required/i,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testAuthError(
      test.name,
      test.credentials,
      test.expectedStatus,
      test.expectedPattern
    );
    
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Delay between tests to avoid rate limiting (1 second)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  log('\n' + '='.repeat(70), 'cyan');
  log('  TEST SUMMARY', 'cyan');
  log('='.repeat(70), 'cyan');
  log(`\n  Total Tests: ${tests.length}`, 'blue');
  log(`  ✅ Passed: ${passed}`, 'green');
  log(`  ❌ Failed: ${failed}`, 'red');
  log(`  Success Rate: ${Math.round((passed / tests.length) * 100)}%\n`, passed === tests.length ? 'green' : 'yellow');

  if (passed === tests.length) {
    log('🎉 All authentication error messages are working correctly!\n', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some tests failed. Please review the error messages above.\n', 'red');
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    log('🔍 Checking if server is running...', 'cyan');
    const response = await fetch(`${BASE_URL}/api/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      log('✅ Server is running\n', 'green');
      return true;
    } else {
      log(`⚠️  Server responded with status ${response.status}`, 'yellow');
      log('   Continuing with tests anyway...\n', 'yellow');
      return true; // Continue anyway
    }
  } catch (error) {
    log(`⚠️  Could not verify server status: ${error.message}`, 'yellow');
    log('   Continuing with tests anyway...', 'yellow');
    log('   If tests fail, ensure server is running with: npm run dev\n', 'yellow');
    return true; // Continue anyway
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  } else {
    process.exit(1);
  }
})();
