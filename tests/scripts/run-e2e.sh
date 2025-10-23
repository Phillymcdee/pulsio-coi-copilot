#!/bin/bash

# End-to-End Test Execution Script
# This script runs the complete E2E test suite for Pulsio

set -e

echo "🚀 Starting Pulsio End-to-End Test Suite"
echo "========================================"

# Check if required dependencies are installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npm/npx not found. Please install Node.js"
    exit 1
fi

# Install Playwright browsers if not already installed
echo "📦 Installing Playwright browsers..."
npx playwright install chromium

# Set environment variables for testing
export NODE_ENV=test
export DATABASE_URL=${DATABASE_URL}

# Start the application in background for testing
echo "🏗️  Starting application server..."
npm run dev &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 10

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    if [[ ! -z "$SERVER_PID" ]]; then
        kill $SERVER_PID 2>/dev/null || true
    fi
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Wait for server to be ready (max 30 seconds)
timeout=30
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:5000 >/dev/null 2>&1; then
        echo "✅ Server is ready!"
        break
    fi
    sleep 1
    timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
    echo "❌ Server failed to start within 30 seconds"
    exit 1
fi

# Run the test suites
echo "🧪 Running End-to-End Tests..."
echo "--------------------------------"

echo "1. Running User Workflow Tests..."
npx playwright test tests/e2e/user-workflow.spec.ts --reporter=line

echo "2. Running Integration Tests..."
npx playwright test tests/e2e/integration.spec.ts --reporter=line

echo "3. Running Performance Tests..."
npx playwright test tests/e2e/performance.spec.ts --reporter=line

echo "4. Running Security Tests..."
npx playwright test tests/e2e/security.spec.ts --reporter=line

# Generate HTML report
echo "📊 Generating test report..."
npx playwright show-report --host=0.0.0.0 --port=9323 &
REPORT_PID=$!

echo ""
echo "✅ End-to-End Test Suite Completed!"
echo "=================================="
echo "📊 Test report available at: http://localhost:9323"
echo "📁 Screenshots and traces saved in: test-results/"
echo ""
echo "To stop the report server, run: kill $REPORT_PID"