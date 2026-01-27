#!/usr/bin/env node
/**
 * Deployment Verification Script
 * 
 * Tests production deployment to ensure all critical services are working
 * 
 * Requirements: US-5.5
 * - Check health endpoint returns 200
 * - Verify auth endpoints exist
 * - Test database connectivity via health check
 * 
 * Usage:
 *   npm run verify-deployment
 *   DEPLOYMENT_URL=https://yourapp.vercel.app npm run verify-deployment
 */

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: Array<{
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    latency?: number;
    message?: string;
  }>;
  uptime: number;
}

interface VerificationResult {
  check: string;
  passed: boolean;
  message: string;
  details?: any;
}

class DeploymentVerifier {
  private baseUrl: string;
  private results: VerificationResult[] = [];

  constructor(baseUrl: string) {
    // Remove trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Run all verification checks
   */
  async verify(): Promise<boolean> {
    console.log('🚀 Starting deployment verification...');
    console.log(`📍 Target URL: ${this.baseUrl}\n`);

    await this.checkHealthEndpoint();
    await this.checkAuthEndpoints();
    await this.checkDatabaseConnectivity();

    this.printResults();

    const allPassed = this.results.every(r => r.passed);
    return allPassed;
  }

  /**
   * Check health endpoint returns 200
   */
  private async checkHealthEndpoint(): Promise<void> {
    const check = 'Health Endpoint';
    
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      // Health endpoint should return 200 (healthy) or 503 (degraded/unhealthy)
      if (response.status === 200 || response.status === 503) {
        const data: HealthResponse = await response.json();
        
        // Check if it's actually healthy (200) or just degraded (503)
        if (response.status === 200) {
          this.results.push({
            check,
            passed: true,
            message: `Health endpoint returned 200 OK`,
            details: {
              status: data.status,
              uptime: `${Math.floor(data.uptime)}s`,
              services: data.services.length,
            },
          });
        } else {
          // 503 but might be degraded (acceptable) or unhealthy (not acceptable)
          const hasDownService = data.services.some(s => s.status === 'down');
          
          this.results.push({
            check,
            passed: !hasDownService,
            message: hasDownService 
              ? `Health endpoint returned 503 - services are down`
              : `Health endpoint returned 503 - services are degraded but functional`,
            details: {
              status: data.status,
              uptime: `${Math.floor(data.uptime)}s`,
              services: data.services.map(s => `${s.service}: ${s.status}`),
            },
          });
        }
      } else {
        this.results.push({
          check,
          passed: false,
          message: `Health endpoint returned unexpected status ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
          },
        });
      }
    } catch (error) {
      this.results.push({
        check,
        passed: false,
        message: `Failed to reach health endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Verify auth endpoints exist and respond correctly
   */
  private async checkAuthEndpoints(): Promise<void> {
    const endpoints = [
      { path: '/api/auth/login', method: 'POST' },
      { path: '/api/auth/me', method: 'GET' },
    ];

    for (const endpoint of endpoints) {
      const check = `Auth Endpoint: ${endpoint.method} ${endpoint.path}`;
      
      try {
        const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          // For POST, send empty body to trigger validation error (not 404)
          body: endpoint.method === 'POST' ? JSON.stringify({}) : undefined,
        });

        // Auth endpoints should exist and return 400/401, not 404
        if (response.status === 404) {
          this.results.push({
            check,
            passed: false,
            message: `Endpoint not found (404)`,
            details: {
              status: response.status,
            },
          });
        } else if (response.status === 400 || response.status === 401) {
          // Expected response for unauthenticated/invalid requests
          this.results.push({
            check,
            passed: true,
            message: `Endpoint exists and responds correctly (${response.status})`,
            details: {
              status: response.status,
            },
          });
        } else {
          // Unexpected status code, but endpoint exists
          this.results.push({
            check,
            passed: true,
            message: `Endpoint exists (returned ${response.status})`,
            details: {
              status: response.status,
            },
          });
        }
      } catch (error) {
        this.results.push({
          check,
          passed: false,
          message: `Failed to reach endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }
  }

  /**
   * Test database connectivity via health check
   */
  private async checkDatabaseConnectivity(): Promise<void> {
    const check = 'Database Connectivity';
    
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data: HealthResponse = await response.json();
        const dbService = data.services.find(s => s.service === 'database');

        if (!dbService) {
          this.results.push({
            check,
            passed: false,
            message: 'Database service not found in health check response',
          });
          return;
        }

        if (dbService.status === 'healthy') {
          this.results.push({
            check,
            passed: true,
            message: `Database is healthy (latency: ${dbService.latency}ms)`,
            details: {
              status: dbService.status,
              latency: `${dbService.latency}ms`,
            },
          });
        } else if (dbService.status === 'degraded') {
          this.results.push({
            check,
            passed: true,
            message: `Database is degraded but functional (latency: ${dbService.latency}ms)`,
            details: {
              status: dbService.status,
              latency: `${dbService.latency}ms`,
            },
          });
        } else {
          this.results.push({
            check,
            passed: false,
            message: `Database is down: ${dbService.message || 'Unknown error'}`,
            details: {
              status: dbService.status,
              message: dbService.message,
            },
          });
        }
      } else {
        this.results.push({
          check,
          passed: false,
          message: `Health endpoint returned ${response.status}, cannot verify database`,
        });
      }
    } catch (error) {
      this.results.push({
        check,
        passed: false,
        message: `Failed to check database connectivity: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Print verification results
   */
  private printResults(): void {
    console.log('\n📊 Verification Results:\n');
    console.log('═'.repeat(80));

    for (const result of this.results) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`\n${icon} ${result.check}`);
      console.log(`   ${result.message}`);
      
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2).split('\n').join('\n   ')}`);
      }
    }

    console.log('\n' + '═'.repeat(80));

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const allPassed = passed === total;

    console.log(`\n${allPassed ? '✅' : '❌'} Overall: ${passed}/${total} checks passed\n`);

    if (allPassed) {
      console.log('🎉 Deployment verification successful! All systems operational.\n');
    } else {
      console.log('⚠️  Deployment verification failed. Please review the errors above.\n');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  // Get deployment URL from environment or use default
  const deploymentUrl = process.env.DEPLOYMENT_URL || 'http://localhost:3000';

  // Validate URL format
  try {
    new URL(deploymentUrl);
  } catch (error) {
    console.error('❌ Invalid DEPLOYMENT_URL:', deploymentUrl);
    console.error('   Please provide a valid URL (e.g., https://yourapp.vercel.app)');
    process.exit(1);
  }

  const verifier = new DeploymentVerifier(deploymentUrl);
  const success = await verifier.verify();

  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Verification script failed:', error);
    process.exit(1);
  });
}

export { DeploymentVerifier };
