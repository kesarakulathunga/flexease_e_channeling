// check-latest-otp.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestOtp() {
  try {
    const email = 'ex@g.c';
    console.log(`Checking latest OTP for email: ${email}`);
    
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
      console.log('Latest valid OTP found:');
      console.log('- Code:', latestOtp.code);
      console.log('- Context:', latestOtp.context);
      console.log('- Purpose:', latestOtp.purpose);
      console.log('- Expires at:', latestOtp.expiresAt);
    } else {
      console.log('No valid OTP found for this email.');
      
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
        console.log('- Expires at:', anyOtp.expiresAt);
        console.log('- Used:', anyOtp.used);
        console.log('- Created at:', anyOtp.createdAt);
      }
    }
  } catch (error) {
    console.error('Error checking OTP:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestOtp();
