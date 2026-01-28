#!/usr/bin/env node

/**
 * Lighthouse Performance Audit Script
 * 
 * This script helps run Lighthouse audits on key pages of the application.
 * It can be run locally or in CI/CD pipelines.
 * 
 * Usage:
 *   node scripts/lighthouse-audit.js [url]
 *   
 * Example:
 *   node scripts/lighthouse-audit.js http://localhost:3000
 *   node scripts/lighthouse-audit.js https://your-app.vercel.app
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function printHeader() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║         Lighthouse Performance Audit Helper               ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝\n', colors.cyan);
}

function printInstructions() {
  log('📊 How to Run Lighthouse Audit:', colors.bright);
  log('\n1. Using Chrome DevTools (Recommended):', colors.cyan);
  log('   • Open your application in Chrome');
  log('   • Press F12 to open DevTools');
  log('   • Click on the "Lighthouse" tab');
  log('   • Select "Performance" category');
  log('   • Choose "Desktop" or "Mobile" device');
  log('   • Click "Analyze page load"');
  
  log('\n2. Using Lighthouse CLI:', colors.cyan);
  log('   • Install: npm install -g lighthouse');
  log('   • Run: lighthouse <url> --view');
  log('   • Example: lighthouse http://localhost:3000 --view');
  
  log('\n3. Using Online Tools:', colors.cyan);
  log('   • PageSpeed Insights: https://pagespeed.web.dev/');
  log('   • WebPageTest: https://www.webpagetest.org/');
  log('   • GTmetrix: https://gtmetrix.com/');
  
  log('\n📋 Key Pages to Test:', colors.bright);
  const pages = [
    { name: 'Landing Page', path: '/', target: '< 2s' },
    { name: 'Login Page', path: '/login', target: '< 2s' },
    { name: 'Admin Dashboard', path: '/admin', target: '< 3s' },
    { name: 'Project Manager Dashboard', path: '/project-manager', target: '< 3s' },
    { name: 'Team Member Dashboard', path: '/team-member', target: '< 3s' },
  ];
  
  pages.forEach(page => {
    log(`   • ${page.name.padEnd(30)} ${page.path.padEnd(30)} Target: ${page.target}`, colors.reset);
  });
  
  log('\n🎯 Performance Targets:', colors.bright);
  log('   • First Contentful Paint (FCP):     < 1.8s', colors.green);
  log('   • Largest Contentful Paint (LCP):   < 2.5s', colors.green);
  log('   • Time to Interactive (TTI):        < 3.8s', colors.green);
  log('   • Total Blocking Time (TBT):        < 300ms', colors.green);
  log('   • Cumulative Layout Shift (CLS):    < 0.1', colors.green);
  log('   • Speed Index:                      < 3.4s', colors.green);
  
  log('\n📈 Interpreting Results:', colors.bright);
  log('   • Score 90-100: Excellent (Green)', colors.green);
  log('   • Score 50-89:  Needs Improvement (Orange)', colors.yellow);
  log('   • Score 0-49:   Poor (Red)', colors.red);
  
  log('\n💡 Quick Fixes for Common Issues:', colors.bright);
  log('   • Large images: Use Next.js Image component');
  log('   • Unused JavaScript: Implement code splitting');
  log('   • Render-blocking resources: Defer non-critical scripts');
  log('   • Large bundle size: Lazy load heavy components');
  log('   • Slow server response: Optimize database queries');
  
  log('\n📝 Saving Results:', colors.bright);
  log('   • Chrome DevTools: Click "Save report" button');
  log('   • CLI: Results saved automatically as HTML');
  log('   • Store in: docs/lighthouse-reports/');
  
  log('\n🔄 Continuous Monitoring:', colors.bright);
  log('   • Run audits before each deployment');
  log('   • Monitor Vercel Analytics dashboard');
  log('   • Set up Lighthouse CI for automated testing');
  log('   • Track Core Web Vitals over time');
}

function createReportDirectory() {
  const reportDir = path.join(process.cwd(), 'docs', 'lighthouse-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
    log(`\n✅ Created directory: ${reportDir}`, colors.green);
  }
}

function generateSampleCommand(url) {
  const baseUrl = url || 'http://localhost:3000';
  log('\n🚀 Sample Lighthouse Commands:', colors.bright);
  log(`\n# Basic audit:`, colors.cyan);
  log(`lighthouse ${baseUrl} --view`);
  
  log(`\n# Performance only:`, colors.cyan);
  log(`lighthouse ${baseUrl} --only-categories=performance --view`);
  
  log(`\n# Mobile audit:`, colors.cyan);
  log(`lighthouse ${baseUrl} --preset=mobile --view`);
  
  log(`\n# Save to file:`, colors.cyan);
  log(`lighthouse ${baseUrl} --output=html --output-path=./docs/lighthouse-reports/report-$(date +%Y%m%d).html`);
  
  log(`\n# Multiple pages:`, colors.cyan);
  log(`lighthouse ${baseUrl} --view`);
  log(`lighthouse ${baseUrl}/login --view`);
  log(`lighthouse ${baseUrl}/admin --view`);
}

function checkLighthouseInstalled() {
  const { execSync } = require('child_process');
  try {
    execSync('lighthouse --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function main() {
  printHeader();
  
  const url = process.argv[2];
  
  if (!url) {
    log('ℹ️  No URL provided. Showing instructions...', colors.yellow);
  }
  
  printInstructions();
  createReportDirectory();
  generateSampleCommand(url);
  
  const isInstalled = checkLighthouseInstalled();
  if (isInstalled) {
    log('\n✅ Lighthouse CLI is installed', colors.green);
  } else {
    log('\n⚠️  Lighthouse CLI not found. Install with:', colors.yellow);
    log('   npm install -g lighthouse', colors.cyan);
  }
  
  log('\n' + '═'.repeat(60), colors.cyan);
  log('For more information, visit:', colors.bright);
  log('https://developer.chrome.com/docs/lighthouse/', colors.cyan);
  log('═'.repeat(60) + '\n', colors.cyan);
}

main();
