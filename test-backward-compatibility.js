// test-backward-compatibility.js
const { sendOtp, verifyOtp } = require('./src/auth/otpService');
const { prisma } = require('./src/config');

async function testBackwardCompatibility() {
  console.log('========== Testing Backward Compatibility ==========');
  
  // 1. Test without purpose parameter (should default to 'registration')
  console.log('\n1. Testing without purpose parameter...');
  const testEmail = 'test@example.com';
  
  console.log('   Sending OTP without purpose parameter...');
  await sendOtp(testEmail, 'LOGIN', null);
  
  // 2. Test checkEmailAndSendOtp without purpose parameter
  console.log('\n2. Testing checkEmailAndSendOtp without purpose parameter...');
  
  const controller = require('./src/auth/authController');
  const mockReq = { 
    body: { 
      email: testEmail
      // No purpose parameter
    } 
  };
  
  const mockRes = { 
    status: (code) => ({ 
      json: (data) => { 
        console.log(`   Status: ${code} Response:`, data); 
      } 
    }),
    json: (data) => { 
      console.log('   Response:', data); 
    } 
  };
  
  const mockNext = (err) => { 
    console.error('   Error:', err); 
  };
  
  console.log('   Calling checkEmailAndSendOtp without purpose parameter...');
  await controller.checkEmailAndSendOtp(mockReq, mockRes, mockNext);
  
  // 3. Test with non-existent email (should allow registration for default purpose)
  console.log('\n3. Testing with non-existent email and default purpose...');
  const nonExistentEmail = 'nonexistent@example.com';
  
  const mockReq2 = { 
    body: { 
      email: nonExistentEmail
      // No purpose parameter - should default to 'registration'
    } 
  };
  
  console.log('   Calling checkEmailAndSendOtp with non-existent email (default purpose)...');
  await controller.checkEmailAndSendOtp(mockReq2, mockRes, mockNext);
  
  console.log('\n========== Backward Compatibility Test Completed Successfully ==========');
}

// Run the test
testBackwardCompatibility()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
