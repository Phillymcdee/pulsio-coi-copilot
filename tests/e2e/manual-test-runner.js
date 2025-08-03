#!/usr/bin/env node

/**
 * Manual Test Runner for Pulsio
 * This script runs API-only tests that work in any environment
 * without requiring browser dependencies
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Running Pulsio End-to-End API Tests');
console.log('=====================================');

function runTest(testFile, testName) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running: ${testName}`);
    console.log('─'.repeat(50));
    
    const testProcess = spawn('npx', [
      'playwright', 'test', 
      testFile, 
      '--reporter=line'
    ], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testName} completed successfully`);
        resolve();
      } else {
        console.log(`❌ ${testName} failed with code ${code}`);
        reject(new Error(`Test failed: ${testName}`));
      }
    });

    testProcess.on('error', (error) => {
      console.error(`❌ Error running ${testName}:`, error.message);
      reject(error);
    });
  });
}

async function runAllTests() {
  const tests = [
    {
      file: 'tests/e2e/api-only.spec.ts',
      name: 'API Integration Tests'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await runTest(test.file, test.name);
      passed++;
    } catch (error) {
      failed++;
      console.error(`Test failed: ${test.name}`);
    }
  }

  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your application is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});