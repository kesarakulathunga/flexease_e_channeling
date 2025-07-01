// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const { prisma, JWT_SECRET } = require('../config');
const { sendOtp, verifyOtp } = require('../services/otpService');
const { createSession, invalidateSession } = require('../services/sessionService');

// A) Check if email exists and send OTP
exports.checkEmailAndSendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if patient with this email exists
    const patients = await prisma.patientProfile.findMany({
      where: { email }
    });
    
    // Send OTP regardless of whether email exists or not
    await sendOtp(email, 'LOGIN', null);
    
    // Return whether email exists and patient profiles if they do
    if (patients.length > 0) {
      res.json({ 
        emailExists: true, 
        patients: patients,
        message: 'OTP sent'
      });
    } else {
      res.json({ 
        emailExists: false,
        message: 'OTP sent'
      });
    }
  } catch (err) { next(err); }
};

// B) Send OTP (shared)
exports.sendOtp = async (req, res, next) => {
  try {
    const { email, role, patientId } = req.body;
    // - role==='PATIENT' → check patientProfile
    // - role==='ADMIN'   → check user.role==='ADMIN'
    if (role === 'PATIENT') {
      const count = await prisma.patientProfile.count({ where: { email }});
      if (!count) return res.status(404).json({ error:'No patient found' });
    } else if (role === 'ADMIN') {
      const user = await prisma.user.findFirst({ where:{ email, role:'ADMIN' }});
      if (!user) return res.status(404).json({ error:'No admin found' });
    } else {
      return res.status(400).json({ error:'Invalid role' });
    }
    await sendOtp(email, 'LOGIN', patientId || null);
    res.json({ message: 'OTP sent' });
  } catch (err) { next(err); }
};

// C) Verify OTP for initial email check (enhanced to return patient profiles)
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    
    try {
      // Verify OTP
      await verifyOtp(email, code, 'LOGIN', null);
      
      // Get all patient profiles for this email
      const patients = await prisma.patientProfile.findMany({
        where: { email }
      });
      
      // Return success response with patient profiles
      res.json({ 
        verified: true,
        hasExistingAccounts: patients.length > 0,
        patients: patients,
        message: 'Email verified successfully'
      });
    } catch (error) {
      res.status(400).json({ 
        verified: false,
        error: error.message 
      });
    }
  } catch (err) { next(err); }
};

// D) Verify OTP & issue session (with auth)
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, code, role, patientId } = req.body;
    await verifyOtp(email, code, 'LOGIN', patientId || null);

    // Build JWT payload
    let payload = { email, role };
    if (role === 'ADMIN') {
      const user = await prisma.user.findUnique({ where:{ email }});
      payload.userId = user.id;
    }
    if (role === 'PATIENT') {
      payload.patientId = patientId;
    }

    // Sign token & persist session
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7*24*60*60*1000);
    await createSession({ userId: payload.userId || null, token, expiresAt });

    res.json({ token, role });
  } catch (err) { next(err); }
};

// E) Logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.token; // attached by authMiddleware
    await invalidateSession(token);
    res.json({ message:'Logged out' });
  } catch (err) { next(err); }
};

// F) Select Account and Issue Token (new endpoint)
exports.selectAccount = async (req, res, next) => {
  try {
    const { email, patientId } = req.body;
    
    if (!email || !patientId) {
      return res.status(400).json({ error: 'Email and patientId are required' });
    }
    
    // Verify patient exists and matches the email
    const patient = await prisma.patientProfile.findUnique({
      where: { id: Number(patientId) }
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    if (patient.email !== email) {
      return res.status(400).json({ error: 'Email does not match the patient profile' });
    }
    
    // Create user record if it doesn't exist
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'PATIENT' },
      create: { email, role: 'PATIENT' }
    });
    
    // Build JWT payload
    const payload = { 
      email, 
      role: 'PATIENT',
      patientId: patient.id
    };
    
    // Sign token & persist session
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7*24*60*60*1000);
    await createSession({ userId: user.id, token, expiresAt });
    
    res.json({ 
      token,
      role: 'PATIENT',
      patient
    });
  } catch (err) { next(err); }
};
