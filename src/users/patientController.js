// src/users/patientController.js
const { prisma } = require('../config');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { createSession } = require('../auth/sessionService');

// 1. Create a new profile with verified email
exports.createPatientWithAuth = async (req, res, next) => {
  try {
    const { email, fullName, age, nicNumber, verifiedEmail } = req.body;
    
    // Validate that email matches the verified email
    if (email !== verifiedEmail) {
      return res.status(400).json({ error: 'Email does not match verified email' });
    }
    
    // Check if a patient with same email and fullName already exists
    const existingPatient = await prisma.patientProfile.findFirst({
      where: { 
        email,
        fullName
      }
    });
    
    if (existingPatient) {
      return res.status(400).json({ error: 'A patient with this email and name already exists' });
    }
      // Create the patient profile
    const patient = await prisma.patientProfile.create({
      data: { 
        email, 
        fullName, 
        age: Number(age), 
        nicNumber: nicNumber || null,
        mobileNumber: req.body.mobileNumber || null 
      }
    });
    
    // Create user record if it doesn't exist
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'PATIENT' },
      create: { email, role: 'PATIENT' }
    });
    
    // Generate authentication token
    const payload = { 
      email, 
      role: 'PATIENT',
      patientId: patient.id
    };
    
    // Sign token & persist session
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7*24*60*60*1000);
    await createSession({ userId: user.id, token, expiresAt });
    
    // Return the patient profile and auth token
    res.status(201).json({
      patient,
      token,
      role: 'PATIENT'
    });
  } catch (err) { next(err); }
};

// 2. Create a new profile
exports.createPatient = async (req, res, next) => {
  try {
    const { email, fullName, age, nicNumber } = req.body;
    const patient = await prisma.patientProfile.create({
      data: { email, fullName, age, nicNumber }
    });
    res.status(201).json(patient);
  } catch (err) { next(err); }
};

// 3. Read all profiles
exports.getAllPatients = async (req, res, next) => {
  try {
    const patients = await prisma.patientProfile.findMany();
    res.json(patients);
  } catch (err) { next(err); }
};

// 4. Read one by ID
exports.getPatientById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }
    const patient = await prisma.patientProfile.findUnique({ where: { id } });
    if (!patient) return res.status(404).json({ error: 'Not found' });
    res.json(patient);
  } catch (err) { next(err); }
};

// 5. Update by ID
exports.updatePatient = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { fullName, age, nicNumber } = req.body;
    const patient = await prisma.patientProfile.update({
      where: { id },
      data: { fullName, age, nicNumber }
    });
    res.json(patient);
  } catch (err) { next(err); }
};

// 6. Delete by ID
exports.deletePatient = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.patientProfile.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
};