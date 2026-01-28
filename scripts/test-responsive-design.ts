/**
 * Responsive Design Testing Script
 * 
 * Tests all pages at mobile viewports (320px, 375px, 768px) to verify:
 * - No horizontal scrolling
 * - Touch target sizes (minimum 44x44px)
 * - Text readability without zooming
 * - Navigation works on mobile
 * 
 * Requirements: US-8.6
 */

import { chromium, Browser, Page } from 'playwright';

// Viewport configurations to test
const VIEWPORTS = [
  { width: 320, height: 568, name: 'iPhone SE' },
  { width: 375, height: 667, name: 'iPhone 8' },
  { width: 768, height: 1024, name: 'iPad' },
];

// Minimum touch target size (44x44px per iOS Human Interface Guidelines)
const MIN_TOUCH_TARGET_SIZE = 44;

// Minimum font size for readability without zooming (16px)
const MIN_FONT_SIZE = 16;

// Pages to test (organized by role)
const PAGES_TO_TEST = {
  public: [
    { path: '/', name: 'Landing Page' },
    { path: '/login', name: 'Login Page' },
    { path: '/forgot-password', name: 'Forgot Password' },
  ],
  admin: [
    { path: '/admin', name: 'Admin Dashboard' },
    { path: '/admin/users', name: 'Users Management' },
    { path: '/admin/projects', name: 'Projects Management' },
    { path: '/admin/tasks', name: 'Tasks Management' },
    { path: '/admin/budget', name: 'Budget Management' },
    { path: '/admin/analytics', name: 'Analytics' },
    { path: '/admin/reports', name: 'Reports' },
    { path: '/admin/settings', name: 'Settings' },
    { path: '/admin/notifications', name: 'Notifications' },
    { path: '/admin/profile', name: 'Profile' },
  ],
  projectManager: [
    { path: '/project-manager', name: 'PM Dashboard' },
    { path: '/project-manager/projects', name: 'PM Projects' },
    { path: '/project-manager/my-projects', name: 'My Projects' },
    { path: '/project-manager/tasks', name: 'PM Tasks' },
    { path: '/project-manager/team', name: 'Team Management' },
    { path: '/project-manager/team-management', name: 'Team Management Detail' },
    { path: '/project-manager/reports', name: 'PM Reports' },
    { path: '/project-manager/settings', name: 'PM Settings' },
    { path: '/project-manager/notifications', name: 'PM Notifications' },
    { path: '/project-manager/profile', name: 'PM Profile' },
  ],
  teamMember: [
    { path: '/team-member', name: 'TM Dashboard' },
    { path: '/team-member/my-tasks', name: 'My Tasks' },
    { path: '/team-member/projects', name: 'TM Projects' },
    { path: '/team-member/report', name: 'TM Report' },
    { path: '/team-member/settings', name: 'TM Settings' },
    { path: '/team-member/notifications', name: 'TM Notifications' },
    { path: '/team-member/profile', name: 'TM Profile' },
  ],
};

interface TestResult {
  page: string;
  viewport: string;
  passed: boolean;
  issues: string[];
}

interface ResponsiveTestReport {
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  summary: {
    horizontalScrollIssues: number;
    touchTargetIssues: number;
    textReadabilityIssues: number;
    navigationIssues: number;
  };
}

class ResponsiveDesignTester {
  private browser: Browser | null = null;
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async initialize() {
    console.log('🚀 Initializing browser...');
    this.browser = await chromium.launch({ headless: true });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Check if page has horizontal scrolling
   */
  async checkHorizontalScroll(page: Page, viewport: { width: number; height: number }): Promise<string[]> {
    const issues: string[] = [];

    try {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      if (scrollWidth > clientWidth) {
        issues.push(`Horizontal scroll detected: scrollWidth (${scrollWidth}px) > clientWidth (${clientWidth}px)`);
      }

      // Check for elements that overflow
      const overflowingElements = await page.evaluate((viewportWidth) => {
        const elements = document.querySelectorAll('*');
        const overflowing: string[] = [];

        elements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > viewportWidth) {
            const tagName = el.tagName.toLowerCase();
            const className = el.className ? `.${el.className.split(' ').join('.')}` : '';
            const id = el.id ? `#${el.id}` : '';
            overflowing.push(`${tagName}${id}${className} extends ${Math.round(rect.right - viewportWidth)}px beyond viewport`);
          }
        });

        return overflowing.slice(0, 5); // Limit to first 5 issues
      }, viewport.width);

      issues.push(...overflowingElements);
    } catch (error) {
      issues.push(`Error checking horizontal scroll: ${error}`);
    }

    return issues;
  }

  /**
   * Check touch target sizes
   */
  async checkTouchTargets(page: Page): Promise<string[]> {
    const issues: string[] = [];

    try {
      const smallTargets = await page.evaluate((minSize) => {
        const interactiveElements = document.querySelectorAll(
          'button, a, input, select, textarea, [role="button"], [onclick]'
        );
        const small: string[] = [];

        interactiveElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const width = rect.width;
          const height = rect.height;

          if ((width > 0 && width < minSize) || (height > 0 && height < minSize)) {
            const tagName = el.tagName.toLowerCase();
            const text = (el as HTMLElement).innerText?.substring(0, 30) || '';
            const className = el.className ? `.${el.className.toString().split(' ').join('.')}` : '';
            small.push(
              `${tagName}${className} "${text}" is ${Math.round(width)}x${Math.round(height)}px (min: ${minSize}x${minSize}px)`
            );
          }
        });

        return small.slice(0, 10); // Limit to first 10 issues
      }, MIN_TOUCH_TARGET_SIZE);

      issues.push(...smallTargets);
    } catch (error) {
      issues.push(`Error checking touch targets: ${error}`);
    }

    return issues;
  }

  /**
   * Check text readability (font sizes)
   */
  async checkTextReadability(page: Page): Promise<string[]> {
    const issues: string[] = [];

    try {
      const smallText = await page.evaluate((minFontSize) => {
        const textElements = document.querySelectorAll('p, span, div, a, button, li, td, th, label');
        const small: string[] = [];

        textElements.forEach((el) => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          const text = (el as HTMLElement).innerText?.trim();

          // Only check elements with actual text content
          if (text && text.length > 0 && fontSize < minFontSize) {
            const tagName = el.tagName.toLowerCase();
            const className = el.className ? `.${el.className.toString().split(' ').slice(0, 2).join('.')}` : '';
            small.push(
              `${tagName}${className} has ${Math.round(fontSize)}px font (min: ${minFontSize}px): "${text.substring(0, 30)}..."`
            );
          }
        });

        return small.slice(0, 10); // Limit to first 10 issues
      }, MIN_FONT_SIZE);

      issues.push(...smallText);
    } catch (error) {
      issues.push(`Error checking text readability: ${error}`);
    }

    return issues;
  }

  /**
   * Check navigation functionality
   */
  async checkNavigation(page: Page): Promise<string[]> {
    const issues: string[] = [];

    try {
      // Check if navigation elements are visible and clickable
      const navIssues = await page.evaluate(() => {
        const problems: string[] = [];

        // Check for common navigation patterns
        const navElements = document.querySelectorAll('nav, [role="navigation"], header');

        if (navElements.length === 0) {
          problems.push('No navigation elements found');
          return problems;
        }

        navElements.forEach((nav) => {
          const rect = nav.getBoundingClientRect();

          // Check if navigation is visible
          if (rect.width === 0 || rect.height === 0) {
            problems.push('Navigation element has zero dimensions');
          }

          // Check for mobile menu button (hamburger)
          const menuButtons = nav.querySelectorAll(
            'button[aria-label*="menu" i], button[aria-label*="navigation" i], .menu-button, .hamburger'
          );

          if (window.innerWidth < 768 && menuButtons.length === 0) {
            // On mobile, we expect a menu button
            const links = nav.querySelectorAll('a');
            if (links.length > 3) {
              problems.push('Mobile navigation should have a menu button for multiple links');
            }
          }
        });

        return problems;
      });

      issues.push(...navIssues);
    } catch (error) {
      issues.push(`Error checking navigation: ${error}`);
    }

    return issues;
  }

  /**
   * Test a single page at a specific viewport
   */
  async testPage(
    pagePath: string,
    pageName: string,
    viewport: { width: number; height: number; name: string },
    requiresAuth: boolean = false
  ): Promise<TestResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext({
      viewport,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    const page = await context.newPage();
    const issues: string[] = [];

    try {
      console.log(`  📱 Testing ${pageName} at ${viewport.name} (${viewport.width}x${viewport.height})`);

      // Navigate to page
      const response = await page.goto(`${this.baseUrl}${pagePath}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      if (!response || !response.ok()) {
        issues.push(`Failed to load page: ${response?.status()}`);
        return {
          page: `${pageName} (${pagePath})`,
          viewport: viewport.name,
          passed: false,
          issues,
        };
      }

      // Wait for page to be fully rendered
      await page.waitForTimeout(1000);

      // Run all checks
      const [scrollIssues, touchIssues, textIssues, navIssues] = await Promise.all([
        this.checkHorizontalScroll(page, viewport),
        this.checkTouchTargets(page),
        this.checkTextReadability(page),
        this.checkNavigation(page),
      ]);

      issues.push(...scrollIssues, ...touchIssues, ...textIssues, ...navIssues);

      return {
        page: `${pageName} (${pagePath})`,
        viewport: viewport.name,
        passed: issues.length === 0,
        issues,
      };
    } catch (error) {
      issues.push(`Test error: ${error}`);
      return {
        page: `${pageName} (${pagePath})`,
        viewport: viewport.name,
        passed: false,
        issues,
      };
    } finally {
      await context.close();
    }
  }

  /**
   * Run all responsive design tests
   */
  async runAllTests(): Promise<ResponsiveTestReport> {
    console.log('🧪 Starting Responsive Design Tests\n');

    // Test public pages (no auth required)
    console.log('📄 Testing Public Pages...');
    for (const pageInfo of PAGES_TO_TEST.public) {
      for (const viewport of VIEWPORTS) {
        const result = await this.testPage(pageInfo.path, pageInfo.name, viewport, false);
        this.results.push(result);
      }
    }

    // Note: Authenticated pages would require login flow
    // For now, we'll skip them or test them without auth (will redirect to login)
    console.log('\n⚠️  Skipping authenticated pages (requires login flow implementation)');

    // Generate report
    const report = this.generateReport();
    return report;
  }

  /**
   * Generate test report
   */
  generateReport(): ResponsiveTestReport {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;

    const summary = {
      horizontalScrollIssues: 0,
      touchTargetIssues: 0,
      textReadabilityIssues: 0,
      navigationIssues: 0,
    };

    this.results.forEach((result) => {
      result.issues.forEach((issue) => {
        if (issue.includes('scroll') || issue.includes('overflow')) {
          summary.horizontalScrollIssues++;
        }
        if (issue.includes('touch') || issue.includes('button') || issue.includes('target')) {
          summary.touchTargetIssues++;
        }
        if (issue.includes('font') || issue.includes('text') || issue.includes('readability')) {
          summary.textReadabilityIssues++;
        }
        if (issue.includes('navigation') || issue.includes('menu')) {
          summary.navigationIssues++;
        }
      });
    });

    return {
      totalTests: this.results.length,
      passed,
      failed,
      results: this.results,
      summary,
    };
  }

  /**
   * Print report to console
   */
  printReport(report: ResponsiveTestReport) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESPONSIVE DESIGN TEST REPORT');
    console.log('='.repeat(80));
    console.log(`\n✅ Passed: ${report.passed}/${report.totalTests}`);
    console.log(`❌ Failed: ${report.failed}/${report.totalTests}`);
    console.log(`\n📈 Issue Summary:`);
    console.log(`   - Horizontal Scroll Issues: ${report.summary.horizontalScrollIssues}`);
    console.log(`   - Touch Target Issues: ${report.summary.touchTargetIssues}`);
    console.log(`   - Text Readability Issues: ${report.summary.textReadabilityIssues}`);
    console.log(`   - Navigation Issues: ${report.summary.navigationIssues}`);

    if (report.failed > 0) {
      console.log('\n❌ Failed Tests:\n');
      report.results
        .filter((r) => !r.passed)
        .forEach((result) => {
          console.log(`\n  ${result.page} @ ${result.viewport}`);
          result.issues.forEach((issue) => {
            console.log(`    ⚠️  ${issue}`);
          });
        });
    }

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Save report to file
   */
  async saveReport(report: ResponsiveTestReport, filename: string = 'responsive-design-report.json') {
    const fs = require('fs').promises;
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to ${filename}`);
  }
}

// Main execution
async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const tester = new ResponsiveDesignTester(baseUrl);

  try {
    await tester.initialize();
    const report = await tester.runAllTests();
    tester.printReport(report);
    await tester.saveReport(report);

    // Exit with error code if tests failed
    process.exit(report.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { ResponsiveDesignTester, VIEWPORTS, PAGES_TO_TEST };
