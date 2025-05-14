// test-view-profile.js
const { sendOtp, verifyOtp } = require('./src/auth/otpService');
const { prisma } = require('./src/config');

async function testViewProfileFlow() {
  console.log('========== Testing "View Your Profile" Flow ==========');
  
  // 1. Create a test patient profile if it doesn't exist
  console.log('\n1. Setup: Creating a test patient profile...');
  const testEmail = 'test@example.com';
  let patient = await prisma.patientProfile.findFirst({
    where: { email: testEmail }
  });
  
  if (!patient) {
    patient = await prisma.patientProfile.create({
      data: {
        email: testEmail,
        fullName: 'Test Patient',
        age: 30,
        nicNumber: 'TEST123456'
      }
    });
    console.log('   Created new test patient:', patient);
  } else {
    console.log('   Using existing test patient:', patient);
  }
  
  // 2. Test with view_profile purpose
  console.log('\n2. Testing with purpose="view_profile"...');
  console.log('   Sending OTP...');
  const code = await sendOtpAndGetCode(testEmail, 'view_profile');
  
  console.log('   Verifying OTP...');
  try {
    const result = await verifyOtp(testEmail, code, 'LOGIN', null, 'view_profile');
    console.log('   OTP verified successfully!', result);
  } catch (error) {
    console.error('   OTP verification failed:', error.message);
    process.exit(1);
  }
  
  // 3. Test with non-existent email
  console.log('\n3. Testing with non-existent email and purpose="view_profile"...');
  const nonExistentEmail = 'nonexistent@example.com';
  
  // Mock the checkEmailAndSendOtp function
  const controller = require('./src/auth/authController');
  const mockReq = { 
    body: { 
      email: nonExistentEmail, 
      purpose: 'view_profile' 
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
  
  console.log('   Calling checkEmailAndSendOtp with non-existent email...');
  await controller.checkEmailAndSendOtp(mockReq, mockRes, mockNext);
  
  console.log('\n========== Test Completed Successfully ==========');
}

async function sendOtpAndGetCode(email, purpose) {
  // This is a hack to get the OTP code for testing
  // In a real app, you'd send the OTP via email/SMS and the user would enter it
  const spy = jest.spyOn(console, 'log');
  await sendOtp(email, 'LOGIN', null, purpose);
  
  // Extract the OTP code from the console.log
  const calls = spy.mock.calls;
  spy.mockRestore();
  
  for (const call of calls) {
    const logMessage = call[0];
    if (typeof logMessage === 'string' && logMessage.includes('OTP for')) {
      const match = logMessage.match(/OTP for .+: (\d+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  
  throw new Error('Could not extract OTP code from logs');
}

// Mock jest.spyOn since we're not using Jest
const jest = {
  spyOn: (obj, method) => {
    const original = obj[method];
    const calls = [];
    obj[method] = function(...args) {
      calls.push(args);
      return original.apply(this, args);
    };
    return {
      mock: { calls },
      mockRestore: () => {
        obj[method] = original;
      }
    };
  }
};

// Run the test
testViewProfileFlow()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
