const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create multiple patients with the same email but different names
  const patients = [
    {
      email: 'patient@example.com',
      fullName: 'John Smith',
      age: 35,
      nicNumber: '932741001V'
    },
    {
      email: 'patient@example.com',
      fullName: 'Jane Smith',
      age: 32,
      nicNumber: '932741002V'
    },
    {
      email: 'patient@example.com',
      fullName: 'Robert Johnson',
      age: 41,
      nicNumber: '932741003V'
    },
    // Different email address examples
    {
      email: 'alex@example.com',
      fullName: 'Alex Brown',
      age: 28,
      nicNumber: '932741004V'
    },
    {
      email: 'sarah@example.com',
      fullName: 'Sarah Wilson',
      age: 45,
      nicNumber: '932741005V'
    }
  ];

  // Create all patients
  for (const patient of patients) {
    try {
      const createdPatient = await prisma.patientProfile.create({
        data: patient
      });
      console.log(`Created patient: ${createdPatient.fullName} with ID: ${createdPatient.id}`);
    } catch (error) {
      console.error(`Failed to create patient ${patient.fullName}: ${error.message}`);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
