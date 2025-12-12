const express = require('express');
const { prisma } = require('../db');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user and create Student or Profesor record based on role
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, nume, prenume, limitaStudenti } = req.body;

    // Validation
    if (!email || !password || !role || !nume || !prenume) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, role, nume, prenume',
      });
    }

    if (!['student', 'profesor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "student" or "profesor"',
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
      },
    });

    // Create Student or Profesor record
    if (role === 'student') {
      await prisma.student.create({
        data: {
          userId: user.id,
          nume,
          prenume,
        },
      });
    } else if (role === 'profesor') {
      await prisma.profesor.create({
        data: {
          userId: user.id,
          nume,
          prenume,
          limitaStudenti: limitaStudenti || 0,
        },
      });
    }

    // Generate token
    const token = generateToken(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      process.env.JWT_EXPIRE
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password',
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      process.env.JWT_EXPIRE
    );

    // Get additional user info based on role
    let userData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      token,
    };

    if (user.role === 'student') {
      const student = await prisma.student.findUnique({
        where: { userId: user.id },
        select: { id: true, nume: true, prenume: true },
      });
      userData = { ...userData, student };
    } else if (user.role === 'profesor') {
      const profesor = await prisma.profesor.findUnique({
        where: { userId: user.id },
        select: { id: true, nume: true, prenume: true, limitaStudenti: true },
      });
      userData = { ...userData, profesor };
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

module.exports = router;
