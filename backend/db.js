const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Attempt to connect and run a simple query
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('✓ Database connection successful!');
    console.log('Connection test result:', result);
    
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:');
    console.error('Error:', error.message);
    return false;
  }
}

async function initializePrisma() {
  try {
    // Test the connection
    const isConnected = await testDatabaseConnection();
    
    if (isConnected) {
      console.log('Prisma ORM initialized successfully');
      return prisma;
    } else {
      console.error('Failed to initialize Prisma ORM');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error initializing Prisma:', error);
    process.exit(1);
  }
}

module.exports = { prisma, initializePrisma, testDatabaseConnection };
