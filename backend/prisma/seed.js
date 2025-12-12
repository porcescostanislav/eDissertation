const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Starting database seed...');

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connection successful');

    // Clear existing data (optional - uncomment if needed)
    // await prisma.cerereDisertatie.deleteMany({});
    // await prisma.sesiuneInscriere.deleteMany({});
    // await prisma.profesor.deleteMany({});
    // await prisma.student.deleteMany({});
    // await prisma.user.deleteMany({});

    // Create sample profesor user and profesor
    const profesorUser = await prisma.user.upsert({
      where: { email: 'profesor@example.com' },
      update: {},
      create: {
        email: 'profesor@example.com',
        passwordHash: hashPassword('profesor123'),
        role: 'profesor',
      },
    });

    const profesor = await prisma.profesor.upsert({
      where: { userId: profesorUser.id },
      update: {},
      create: {
        userId: profesorUser.id,
        nume: 'Popescu',
        prenume: 'Ion',
        limitaStudenti: 10,
      },
    });

    // Create sample student users and students
    const studentUser1 = await prisma.user.upsert({
      where: { email: 'student1@example.com' },
      update: {},
      create: {
        email: 'student1@example.com',
        passwordHash: hashPassword('student123'),
        role: 'student',
      },
    });

    const student1 = await prisma.student.upsert({
      where: { userId: studentUser1.id },
      update: {},
      create: {
        userId: studentUser1.id,
        nume: 'Georgescu',
        prenume: 'Maria',
      },
    });

    const studentUser2 = await prisma.user.upsert({
      where: { email: 'student2@example.com' },
      update: {},
      create: {
        email: 'student2@example.com',
        passwordHash: hashPassword('student456'),
        role: 'student',
      },
    });

    const student2 = await prisma.student.upsert({
      where: { userId: studentUser2.id },
      update: {},
      create: {
        userId: studentUser2.id,
        nume: 'Ionescu',
        prenume: 'Alexandru',
      },
    });

    // Create sample sesiune inscriere
    const sesiune = await prisma.sesiuneInscriere.create({
      data: {
        profesorId: profesor.id,
        dataInceput: new Date('2025-01-15T09:00:00'),
        dataSfarsit: new Date('2025-02-15T17:00:00'),
        limitaStudenti: 5,
      },
    });

    // Create sample dissertation requests
    const cerere1 = await prisma.cerereDisertatie.create({
      data: {
        studentId: student1.id,
        sesiuneId: sesiune.id,
        profesorId: profesor.id,
        status: 'pending',
      },
    });

    const cerere2 = await prisma.cerereDisertatie.create({
      data: {
        studentId: student2.id,
        sesiuneId: sesiune.id,
        profesorId: profesor.id,
        status: 'pending',
      },
    });

    console.log('✓ Database seed completed successfully');
    console.log('\nCreated:');
    console.log(`  - Profesor: ${profesor.nume} ${profesor.prenume}`);
    console.log(`  - Students: ${student1.nume} ${student1.prenume}, ${student2.nume} ${student2.prenume}`);
    console.log(`  - Sesiune: ${sesiune.dataInceput} to ${sesiune.dataSfarsit}`);
    console.log(`  - Dissertation requests: ${cerere1.id}, ${cerere2.id}`);
  } catch (error) {
    console.error('✗ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
