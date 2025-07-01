// src/auth/sessionService.js
const { prisma } = require('../config');

async function createSession({ userId, token, expiresAt }) {
  return prisma.session.create({
    data: { userId, token, expiresAt }
  });
}

async function findActiveSession(token) {
  return prisma.session.findFirst({
    where: { token, isActive: true }
  });
}

async function invalidateSession(token) {
  return prisma.session.updateMany({
    where: { token },
    data: { isActive: false }
  });
}

module.exports = { createSession, findActiveSession, invalidateSession };