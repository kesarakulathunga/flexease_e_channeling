// src/services/otpEmailService.js
const nodemailer = require('nodemailer');
let sendgrid;

try {
  // Attempt to load SendGrid if installed
  sendgrid = require('@sendgrid/mail');
} catch (e) {
  // SendGrid is optional, will use Nodemailer as fallback
}

// Maintain transporter state
let transporter;
let etherealCreated = false;
let usingSendGrid = false;

/**
 * Initialize email transporter with fallback mechanisms
 * 1. First tries configured SMTP credentials
 * 2. Falls back to SendGrid API if available and configured
 * 3. Falls back to Ethereal test account
 * 4. Last resort - console logging only
 */
async function initTransporter() {
  // Return existing transporter if already initialized
  if (transporter) {
    return { transporter, usingSendGrid };
  }

  try {
    // Try SendGrid API integration first if available and configured
    if (sendgrid && process.env.EMAIL_HOST === 'smtp.sendgrid.net' && process.env.EMAIL_PASS) {
      try {
        console.log('[EMAIL] Attempting SendGrid API integration');
        sendgrid.setApiKey(process.env.EMAIL_PASS);
        usingSendGrid = true;
        
        // Create a wrapper around SendGrid that matches Nodemailer's interface
        transporter = { 
          sendMail: async (options) => {
            const msg = {
              to: options.to,
              from: options.from,
              subject: options.subject,
              text: options.text || extractTextFromHtml(options.html),
              html: options.html,
            };
            
            await sendgrid.send(msg);
            return { 
              messageId: `sendgrid-${Date.now()}`,
              response: 'SendGrid API used for delivery'
            };
          },
          verify: async () => true // Simple verification for SendGrid API
        };
        
        console.log('[EMAIL] Successfully configured SendGrid API transport');
        return { transporter, usingSendGrid };
      } catch (sendgridError) {
        console.error('[EMAIL] SendGrid API initialization failed:', sendgridError.message);
        console.log('[EMAIL] Falling back to standard SMTP...');
        // Continue to standard SMTP
      }
    }
      // For production, use configured SMTP credentials
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('[EMAIL] Using configured SMTP credentials');
      try {
        // Use Gmail service directly if host is gmail
        if (process.env.EMAIL_HOST === 'smtp.gmail.com') {
          console.log('[EMAIL] Using Gmail service configuration');
          transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
        } else {
          // Otherwise use standard SMTP configuration
          transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
        }
        
        // Verify connection configuration with timeout
        await Promise.race([
          transporter.verify(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SMTP verification timeout')), 10000)
          )
        ]);
        
        console.log('[EMAIL] SMTP connection verified successfully');
        return { transporter, usingSendGrid: false };
      } catch (verifyError) {
        console.error('[EMAIL] Failed to verify SMTP connection:', verifyError.message);
        console.log('[EMAIL] Falling back to Ethereal test account...');
        // Fall back to Ethereal
        return await createEtherealTransporter();
      }
    } 
    // For development/testing, create an ethereal account if needed
    else {
      return await createEtherealTransporter();
    }
  } catch (error) {
    console.error('[EMAIL] Failed to initialize ANY email transport:', error.message);
    console.log('[EMAIL] Using console-only fallback for email delivery');
    
    // Absolute last resort - just log to console and simulate email sending
    transporter = {
      sendMail: async (options) => {
        console.log('\n[EMAIL-FALLBACK] Email would have been sent:');
        console.log(`- From: ${options.from}`);
        console.log(`- To: ${options.to}`);
        console.log(`- Subject: ${options.subject}`);
        console.log(`- Content: OTP code in HTML format`);
        if (options.html) {
          // Extract OTP code from HTML if possible
          const otpMatch = options.html.match(/<strong>(\d+)<\/strong>/);
          if (otpMatch && otpMatch[1]) {
            console.log(`- OTP Code: ${otpMatch[1]}`);
          }
        }
        console.log('');
        
        return { messageId: `console-${Date.now()}` };
      },
      verify: async () => true
    };
    
    return { transporter, usingSendGrid: false };
  }
}

// Helper function to create an Ethereal email account
async function createEtherealTransporter() {
  console.log('[EMAIL] Creating Ethereal test account...');
  
  try {
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
    return { transporter, usingSendGrid: false };
  } catch (error) {
    console.error('[EMAIL] Failed to create Ethereal account:', error.message);
    throw error; // Let the main function handle this error
  }
}

// Extract plain text from HTML for text-only email clients
function extractTextFromHtml(html) {
  if (!html) return '';
  // Simple HTML to text conversion
  return html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Send an OTP verification email
 * @param {string} to - Recipient email address
 * @param {string} code - OTP code to send
 * @param {string} context - Application context (e.g., 'LOGIN', 'EMAIL_CHANGE')
 * @param {string} purpose - Purpose of the OTP (e.g., 'registration', 'view_profile')
 * @param {object} options - Additional options
 * @param {boolean} options.isHtml - Whether to send HTML email (default: true)
 * @param {string} options.templateName - Template name to use (future feature)
 * @returns {Promise<Object>} - Email sending result with metadata
 */
async function sendOtpEmail(to, code, context, purpose, options = {}) {
  // Default options
  const { isHtml = true, templateName = 'default' } = options;
  
  // Track start time for performance measurement
  const startTime = Date.now();
  
  try {
    // Initialize the email transporter
    const { transporter, usingSendGrid } = await initTransporter();

    // Format purpose for display
    const formattedPurpose = purpose.replace(/_/g, ' ');
    
    // Build the email subject
    const subject = `Your verification code for ${formattedPurpose}`;
    
    // Create HTML content
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Verification Code</h2>
      <p>Please use the following code to complete the ${formattedPurpose} process:</p>
      <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; text-align: center; margin: 20px 0; letter-spacing: 5px;">
        <strong>${code}</strong>
      </div>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
      <hr>
      <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply.</p>
    </div>
    `;
    
    // Create plain text alternative
    const text = `
Your Verification Code

Please use the following code to complete the ${formattedPurpose} process:

${code}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.

---
This is an automated message. Please do not reply.
    `.trim();

    // Prepare email data
    const emailData = {
      from: process.env.EMAIL_FROM || '"OTP Service" <otp@example.com>',
      to,
      subject,
      html: isHtml ? html : undefined,
      text: isHtml ? text : text, // Always include text version for better deliverability
    };

    // Send the email
    const info = await transporter.sendMail(emailData);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Get preview URL for Ethereal
    let previewUrl;
    if (etherealCreated) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[EMAIL] Preview URL: ${previewUrl}`);
    }

    // Log success
    console.log(`[EMAIL] OTP for ${to} (purpose: ${purpose}) sent in ${responseTime}ms. MessageId: ${info.messageId}`);
    
    // Return detailed information
    return {
      success: true,
      messageId: info.messageId,
      recipient: to,
      purpose,
      context,
      responseTime,
      messageUrl: previewUrl,
      provider: usingSendGrid ? 'sendgrid' : (etherealCreated ? 'ethereal' : 'smtp')
    };
  } catch (error) {
    // Calculate response time even for failures
    const responseTime = Date.now() - startTime;
    
    // Log the error
    console.error(`[EMAIL] Failed to send OTP to ${to} (${responseTime}ms):`, error.message);
    
    // Return detailed error information
    return {
      success: false,
      error: error.message,
      recipient: to,
      purpose,
      context,
      responseTime,
      fallbackUsed: true,
      // Pass the OTP in the result for fallback handling
      code
    };
  }
}

module.exports = {
  sendOtpEmail,
  initTransporter, // Export for testing purposes
};
