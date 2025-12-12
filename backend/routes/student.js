const express = require('express');
const multer = require('multer');
const path = require('path');
const { prisma } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

/**
 * Middleware to verify user is a student
 */
async function studentOnly(req, res, next) {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'This action requires student role',
      });
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    req.student = student;
    next();
  } catch (error) {
    console.error('Student validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * POST /api/student/applications
 * Create a new dissertation application (CerereDisertatie)
 */
router.post('/applications', authMiddleware, studentOnly, async (req, res) => {
  try {
    const { sesiuneId, profesorId } = req.body;

    // Validation
    if (!sesiuneId || !profesorId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sesiuneId, profesorId',
      });
    }

    // Parse IDs
    const sessionId = parseInt(sesiuneId);
    const profId = parseInt(profesorId);

    if (isNaN(sessionId) || isNaN(profId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sesiuneId or profesorId. Must be numbers.',
      });
    }

    // Fetch enrollment session
    const session = await prisma.sesiuneInscriere.findUnique({
      where: { id: sessionId },
      include: {
        _count: {
          select: { cerereDisertatie: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Verify profesor owns this session
    if (session.profesorId !== profId) {
      return res.status(400).json({
        success: false,
        message: 'Professor does not own this session',
      });
    }

    // Check if session is active (currently running)
    const now = new Date();
    if (session.dataInceput > now) {
      return res.status(409).json({
        success: false,
        message: 'Cannot enroll in a session that has not started yet',
      });
    }

    if (session.dataSfarsit < now) {
      return res.status(409).json({
        success: false,
        message: 'Cannot enroll in a session that has already ended',
      });
    }

    // Check if session has available slots
    if (session._count.cerereDisertatie >= session.limitaStudenti) {
      return res.status(409).json({
        success: false,
        message: `Session is full (${session.limitaStudenti}/${session.limitaStudenti} slots)`,
      });
    }

    // Check if student already applied to this session
    const existingApplication = await prisma.cerereDisertatie.findUnique({
      where: {
        studentId_sesiuneId: {
          studentId: req.student.id,
          sesiuneId: sessionId,
        },
      },
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this session',
        data: {
          applicationId: existingApplication.id,
          status: existingApplication.status,
        },
      });
    }

    // Create dissertation application
    const application = await prisma.cerereDisertatie.create({
      data: {
        studentId: req.student.id,
        sesiuneId: sessionId,
        profesorId: profId,
        status: 'pending',
      },
      include: {
        student: {
          select: {
            id: true,
            nume: true,
            prenume: true,
          },
        },
        sesiune: {
          select: {
            id: true,
            dataInceput: true,
            dataSfarsit: true,
            limitaStudenti: true,
          },
        },
        profesor: {
          select: {
            id: true,
            nume: true,
            prenume: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        id: application.id,
        studentId: application.studentId,
        student: application.student,
        sesiuneId: application.sesiuneId,
        sesiune: application.sesiune,
        profesorId: application.profesorId,
        profesor: application.profesor,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error('Application creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * GET /api/student/applications
 * List all dissertation applications for the authenticated student
 */
router.get('/applications', authMiddleware, studentOnly, async (req, res) => {
  try {
    const { status } = req.query;

    // Build filter
    let where = {
      studentId: req.student.id,
    };

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.status = status;
    }

    // Fetch applications
    const applications = await prisma.cerereDisertatie.findMany({
      where,
      include: {
        sesiune: {
          select: {
            id: true,
            dataInceput: true,
            dataSfarsit: true,
            limitaStudenti: true,
          },
        },
        profesor: {
          select: {
            id: true,
            nume: true,
            prenume: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response
    const formattedApplications = applications.map((app) => ({
      id: app.id,
      sesiuneId: app.sesiuneId,
      sesiune: app.sesiune,
      profesorId: app.profesorId,
      profesor: app.profesor,
      status: app.status,
      justificareRespingere: app.justificareRespingere,
      fisierSemnatUrl: app.fisierSemnatUrl,
      fisierRaspunsUrl: app.fisierRaspunsUrl,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      data: formattedApplications,
      pagination: {
        total: formattedApplications.length,
      },
    });
  } catch (error) {
    console.error('Application retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * GET /api/student/applications/:id
 * Get details of a specific dissertation application
 */
router.get('/applications/:id', authMiddleware, studentOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Parse application ID
    const appId = parseInt(id);
    if (isNaN(appId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID',
      });
    }

    // Fetch application
    const application = await prisma.cerereDisertatie.findUnique({
      where: { id: appId },
      include: {
        sesiune: {
          select: {
            id: true,
            dataInceput: true,
            dataSfarsit: true,
            limitaStudenti: true,
          },
        },
        profesor: {
          select: {
            id: true,
            nume: true,
            prenume: true,
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Verify ownership
    if (application.studentId !== req.student.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this application',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Application retrieved successfully',
      data: {
        id: application.id,
        studentId: application.studentId,
        sesiuneId: application.sesiuneId,
        sesiune: application.sesiune,
        profesorId: application.profesorId,
        profesor: application.profesor,
        status: application.status,
        justificareRespingere: application.justificareRespingere,
        fisierSemnatUrl: application.fisierSemnatUrl,
        fisierRaspunsUrl: application.fisierRaspunsUrl,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
      },
    });
  } catch (error) {
    console.error('Application detail retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * GET /api/student/sessions
 * Get list of available sessions for enrollment (active sessions)
 */
router.get('/sessions', authMiddleware, studentOnly, async (req, res) => {
  try {
    const now = new Date();

    // Fetch active sessions
    const sessions = await prisma.sesiuneInscriere.findMany({
      where: {
        dataInceput: { lte: now },
        dataSfarsit: { gte: now },
      },
      include: {
        profesor: {
          select: {
            id: true,
            nume: true,
            prenume: true,
          },
        },
        _count: {
          select: { cerereDisertatie: true },
        },
      },
      orderBy: {
        dataInceput: 'desc',
      },
    });

    // Check which sessions student already applied to
    const studentApplications = await prisma.cerereDisertatie.findMany({
      where: {
        studentId: req.student.id,
      },
      select: {
        sesiuneId: true,
      },
    });

    const appliedSessionIds = studentApplications.map((app) => app.sesiuneId);

    // Format response
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      profesorId: session.profesorId,
      profesor: session.profesor,
      dataInceput: session.dataInceput,
      dataSfarsit: session.dataSfarsit,
      limitaStudenti: session.limitaStudenti,
      enrolledCount: session._count.cerereDisertatie,
      availableSlots: session.limitaStudenti - session._count.cerereDisertatie,
      alreadyApplied: appliedSessionIds.includes(session.id),
      canApply:
        session.limitaStudenti - session._count.cerereDisertatie > 0 &&
        !appliedSessionIds.includes(session.id),
      createdAt: session.createdAt,
    }));

    return res.status(200).json({
      success: true,
      message: 'Available sessions retrieved successfully',
      data: formattedSessions,
      pagination: {
        total: formattedSessions.length,
        available: formattedSessions.filter((s) => s.canApply).length,
      },
    });
  } catch (error) {
    console.error('Available sessions retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * POST /api/student/applications/:id/upload-signed
 * Upload signed file for an approved application
 */
router.post('/applications/:id/upload-signed', authMiddleware, studentOnly, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;

    // Parse application ID
    const appId = parseInt(id);
    if (isNaN(appId)) {
      // Clean up uploaded file if exists
      if (req.file) {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID',
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Fetch application
    const application = await prisma.cerereDisertatie.findUnique({
      where: { id: appId },
    });

    if (!application) {
      // Clean up file
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Verify ownership
    if (application.studentId !== req.student.id) {
      // Clean up file
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this application',
      });
    }

    // Check if application is approved
    if (application.status !== 'approved') {
      // Clean up file
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
      return res.status(409).json({
        success: false,
        message: 'Only approved applications can have signed files uploaded',
      });
    }

    // Generate file URL
    const fileUrl = `/uploads/${req.file.filename}`;

    // Update application with file URL
    const updatedApplication = await prisma.cerereDisertatie.update({
      where: { id: appId },
      data: {
        fisierSemnatUrl: fileUrl,
      },
      include: {
        sesiune: {
          select: {
            id: true,
            dataInceput: true,
            dataSfarsit: true,
            limitaStudenti: true,
          },
        },
        profesor: {
          select: {
            id: true,
            nume: true,
            prenume: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Signed file uploaded successfully',
      data: {
        id: updatedApplication.id,
        fisierSemnatUrl: updatedApplication.fisierSemnatUrl,
        updatedAt: updatedApplication.updatedAt,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up uploaded file if exists
    if (req.file) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (fsError) {
        console.error('Error cleaning up file:', fsError);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

module.exports = router;
