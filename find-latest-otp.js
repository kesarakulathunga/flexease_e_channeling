// find-latest-otp.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findLatestOTP() {
  try {
    const email = 'ex@g.c';
    console.log(`Finding latest OTP for email: ${email}`);
    
    // Find the latest OTP for this email
    const latestOTP = await prisma.oTP.findFirst({
      where: {
        email,
        used: false,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (latestOTP) {
      console.log('Latest OTP found:');
      console.log({
        email: latestOTP.email,
        code: latestOTP.code,
        context: latestOTP.context,
        purpose: latestOTP.purpose,
        expiresAt: latestOTP.expiresAt,
        createdAt: latestOTP.createdAt
      });
      
      // Calculate expiration
      const now = new Date();
      const expiresIn = Math.floor((latestOTP.expiresAt - now) / 1000);
      
      if (expiresIn > 0) {
        console.log(`\nThis OTP is still valid for ${expiresIn} seconds`);
      } else {
        console.log('\nThis OTP has EXPIRED');
      }
      
    } else {
      console.log('No active OTP found for this email');
    }
    
  } catch (err) {
    console.error('Error finding OTP:', err);
  } finally {
    await prisma.$disconnect();
  }
}

findLatestOTP();
