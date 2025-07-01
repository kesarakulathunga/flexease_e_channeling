// src/config/index.js
require('dotenv').config();            // loads .env into process.env
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],     // optional: see SQL queries in your console
});

module.exports = {
  prisma,
  JWT_SECRET: process.env.JWT_SECRET,
};
