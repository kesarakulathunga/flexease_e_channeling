// src/services/emailService.js
const nodemailer = require('nodemailer');

// Try to load SendGrid if installed
let sendgrid;
let usingSendGrid = false;
try {
  sendgrid = require('@sendgrid/mail');
} catch (e) {
  // SendGrid is optional, so we can continue without it
  console.log('[EMAIL] SendGrid package not found, using Nodemailer transport only');
}

// Create a transporter object
let transporter;
let etherealCreated = false;

// Initialize the email transporter
async function initTransporter() {
  if (transporter) {
    return transporter;
  }

  try {
    // Check if we should use SendGrid API (preferred for production)
    if (sendgrid && process.env.EMAIL_HOST === 'smtp.sendgrid.net' && process.env.EMAIL_PASS) {
      try {
        console.log('[EMAIL] Initializing SendGrid API transport');
        sendgrid.setApiKey(process.env.EMAIL_PASS);
        usingSendGrid = true;
        
        // Create a special transporter that uses SendGrid's API instead of SMTP
        transporter = {
          sendMail: async (options) => {
            const msg = {
              to: options.to,
              from: options.from,
              subject: options.subject,
              html: options.html,
              text: options.text || ''
            };
            
            await sendgrid.send(msg);
            return { 
              messageId: `sendgrid-${Date.now()}`,
              response: 'SendGrid API used'
            };
          },
          verify: async () => true
        };
        
        return transporter;
      } catch (sgError) {
        console.error('[EMAIL] Failed to initialize SendGrid API:', sgError.message);
        console.log('[EMAIL] Falling back to standard SMTP...');
        // Continue with standard SMTP setup
      }
    }
    
    // For production, use configured SMTP credentials
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('[EMAIL] Using configured email credentials');
      try {
        transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        
        // Verify connection configuration
        await transporter.verify();
        console.log('[EMAIL] SMTP connection verified successfully');
      } catch (verifyError) {
        console.error('[EMAIL] Failed to verify SMTP connection:', verifyError.message);
        console.log('[EMAIL] Falling back to Ethereal test account...');
        // Fall back to Ethereal
        return await createEtherealTransporter();
      }
    } 
    // For development/testing, create an ethereal account on the fly if needed
    else {
      return await createEtherealTransporter();
    }
    
    return transporter;
  } catch (error) {
    console.error('[EMAIL] Failed to initialize email transporter:', error.message);
    throw error;
  }
}

// Helper function to create an Ethereal email account
async function createEtherealTransporter() {
  console.log('[EMAIL] Creating Ethereal test account...');
  
  // Create a test account at Ethereal
  const testAccount = await nodemailer.createTestAccount();
  etherealCreated = true;
  
  console.log(`[EMAIL] Created Ethereal test account: ${testAccount.user}`);
  
  // Create a reusable transporter object using the test account
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });  
  return transporter;
}

/**
 * Send an email with OTP
 * @param {string} to - Recipient email address
 * @param {string} code - OTP code
 * @param {string} context - Context of the OTP (e.g., 'LOGIN')
 * @param {string} purpose - Purpose of the OTP (e.g., 'registration', 'view_profile')
 * @returns {Promise<Object>} - The information of sent email
 */
async function sendOtpEmail(to, code, context, purpose) {
  const transporter = await initTransporter();

  // Basic email template with the OTP
  const subject = `Your verification code for ${purpose.replace('_', ' ')}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Verification Code</h2>
      <p>Please use the following code to complete the ${purpose.replace('_', ' ')} process:</p>
      <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; text-align: center; margin: 20px 0; letter-spacing: 5px;">
        <strong>${code}</strong>
      </div>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
      <hr>
      <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply.</p>
    </div>
  `;

  // Send the email
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"OTP Service" <otp@example.com>',
    to,
    subject,
    html,
  });

  console.log(`[EMAIL] OTP for ${to} (purpose: ${purpose}) sent. MessageId: ${info.messageId}`);
  
  // For development with Ethereal, log the preview URL
  let previewUrl;
  if (etherealCreated || (process.env.NODE_ENV !== 'production' && process.env.EMAIL_HOST === 'smtp.ethereal.email')) {
    previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EMAIL] Preview URL: ${previewUrl}`);
  }

  // Return info with optional preview URL
  return {
    ...info,
    messageUrl: previewUrl
  };
}

module.exports = {
  sendOtpEmail,
};
