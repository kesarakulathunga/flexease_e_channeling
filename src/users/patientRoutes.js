// src/users/patientRoutes.js
const router = require('express').Router();
const {
  createPatient,
  createPatientWithAuth,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
} = require('./patientController');

// Public endpoint for creating a new patient with auth after email verification
router.post('/register-verified', createPatientWithAuth);

// Regular CRUD endpoints
router.post('/', createPatient);
router.get('/', getAllPatients);
router.get('/:id', getPatientById);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

module.exports = router;