// check-email-change-otp.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmailChangeOtp() {
  try {
    const email = 'new.email@example.com';
    console.log(`Checking OTP for email change to: ${email}`);
    
    // Get the latest OTP for this email
    const latestOtp = await prisma.oTP.findFirst({
      where: {
        email,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (latestOtp) {
      console.log('\nEmail change OTP found:');
      console.log('- Code:', latestOtp.code);
      console.log('- Context:', latestOtp.context);
      console.log('- Purpose:', latestOtp.purpose);
      console.log('- Patient ID:', latestOtp.patientId);
      console.log('- Expires at:', latestOtp.expiresAt);
    } else {
      console.log('\nNo valid OTP found for email change.');
      
      // Check if there are any expired or used OTPs
      const anyOtp = await prisma.oTP.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' }
      });
      
      if (anyOtp) {
        console.log('\nMost recent OTP (may be expired or used):');
        console.log('- Code:', anyOtp.code);
        console.log('- Context:', anyOtp.context);
        console.log('- Purpose:', anyOtp.purpose);
        console.log('- Patient ID:', anyOtp.patientId);
        console.log('- Expires at:', anyOtp.expiresAt);
        console.log('- Used:', anyOtp.used);
        console.log('- Created at:', anyOtp.createdAt);
      }
    }
  } catch (error) {
    console.error('Error checking email change OTP:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailChangeOtp();
