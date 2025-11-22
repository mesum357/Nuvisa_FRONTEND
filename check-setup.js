#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Stripe Development Setup...\n');

let allGood = true;

// Check .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists');
  
  // Check for Stripe key
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_')) {
    console.log('✅ Stripe publishable key is configured');
  } else if (envContent.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sk_test_')) {
    console.log('⚠️  WARNING: You have a SECRET key in .env.local');
    console.log('   You need a PUBLISHABLE key (starts with pk_test_)');
    console.log('   Get it from: https://dashboard.stripe.com/test/apikeys');
    allGood = false;
  } else {
    console.log('❌ Stripe publishable key not configured');
    console.log('   Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local');
    allGood = false;
  }
} else {
  console.log('❌ .env.local file not found');
  allGood = false;
}

// Check mock API exists
const mockApiPath = path.join(__dirname, 'src', 'pages', 'api', 'mock-payment-intent.js');
if (fs.existsSync(mockApiPath)) {
  console.log('✅ Mock API endpoint exists');
} else {
  console.log('❌ Mock API endpoint not found');
  allGood = false;
}

// Check test page exists
const testPagePath = path.join(__dirname, 'src', 'pages', 'test-stripe.jsx');
if (fs.existsSync(testPagePath)) {
  console.log('✅ Test page exists');
} else {
  console.log('❌ Test page not found');
  allGood = false;
}

// Check stripePayment.ts has mock mode
const stripeApiPath = path.join(__dirname, 'src', 'api', 'stripePayment.ts');
if (fs.existsSync(stripeApiPath)) {
  const content = fs.readFileSync(stripeApiPath, 'utf8');
  if (content.includes('USE_MOCK_API')) {
    console.log('✅ Mock mode is configured in stripePayment.ts');
    if (content.includes('USE_MOCK_API = true')) {
      console.log('✅ Mock mode is ENABLED (good for development)');
    } else {
      console.log('⚠️  Mock mode is DISABLED (requires backend)');
    }
  } else {
    console.log('❌ Mock mode not found in stripePayment.ts');
    allGood = false;
  }
} else {
  console.log('❌ stripePayment.ts not found');
  allGood = false;
}

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('✅ All checks passed! You\'re ready to go!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open: http://localhost:3000/test-stripe');
  console.log('3. Start building your Stripe UI! 🎨');
} else {
  console.log('❌ Some issues found. Please fix them and try again.');
  console.log('\nSee QUICK_START_STRIPE.md for setup instructions.');
}

console.log('='.repeat(50) + '\n');
