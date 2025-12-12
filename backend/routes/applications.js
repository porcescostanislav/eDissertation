const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
 * Middleware to verify user is a professor
 */
async function profesorOnly(req, res, next) {
  try {
    if (req.user.role !== 'profesor') {
      return res.status(403).json({
        success: false,
        message: 'This action requires profesor role',
      });
    }

    // Get profesor record
    const profesor = await prisma.profesor.findUnique({
      where: { userId: req.user.userId },
    });

    if (!profesor) {
      return res.status(404).json({
        success: false,
        message: 'Profesor profile not found',
      });
    }

    req.profesor = profesor;
    next();
  } catch (error) {
    console.error('Profesor validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * GET /api/profesor/applications/:id/unsigned-template
 * Download unsigned template for student to sign and return
 */
router.get('/applications/:id/unsigned-template', authMiddleware, profesorOnly, async (req, res) => {
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
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Verify professor owns this application
    if (application.profesorId !== req.profesor.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this application',
      });
    }

    // Check if application is approved
    if (application.status !== 'approved') {
      return res.status(409).json({
        success: false,
        message: 'Unsigned template is only available for approved applications',
      });
    }

    // Create a simple text-based template response
    // In a real application, you might generate a PDF or return a pre-made template
    const templateContent = `
DISSERTATION APPLICATION FORM - UNSIGNED TEMPLATE

Application ID: ${application.id}
Student ID: ${application.studentId}
Session ID: ${application.sesiuneId}

---

This is an unsigned template. Please fill in your information, print this document, sign it, 
and upload the signed PDF version back to the application system.

Student Name: ___________________________
Date: ___________________________
Signature: ___________________________

---

For questions, contact your professor.
    `.trim();

    // Set response headers to download as file
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="dissertation-template-${application.id}.txt"`);
    
    return res.send(templateContent);
  } catch (error) {
    console.error('Template retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/profesor/applications/:id/approve
 * Approve a student's dissertation application
 * Checks professor's session limit and auto-rejects other pending applications from the student
 */
router.patch('/applications/:id/approve', authMiddleware, profesorOnly, async (req, res) => {
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

    // Fetch application with all necessary data
    const application = await prisma.cerereDisertatie.findUnique({
      where: { id: appId },
      include: {
        student: true,
        sesiune: true,
        profesor: true,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Verify professor owns this application
    if (application.profesorId !== req.profesor.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this application',
      });
    }

    // Check if application is already processed
    if (application.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: `Application is already ${application.status}. Cannot change status.`,
      });
    }

    // Check if professor has reached the session limit
    const approvedCount = await prisma.cerereDisertatie.count({
      where: {
        sesiuneId: application.sesiuneId,
        profesorId: req.profesor.id,
        status: 'approved',
      },
    });

    if (approvedCount >= application.sesiune.limitaStudenti) {
      return res.status(409).json({
        success: false,
        message: `Session has reached its limit of ${application.sesiune.limitaStudenti} approved students`,
      });
    }

    // Start transaction: approve this application and reject others for this student
    const approvedApplication = await prisma.$transaction(async (tx) => {
      // Approve the application
      const approved = await tx.cerereDisertatie.update({
        where: { id: appId },
        data: {
          status: 'approved',
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

      // Auto-reject all other pending applications for this student with other professors
      await tx.cerereDisertatie.updateMany({
        where: {
          studentId: application.studentId,
          status: 'pending',
          NOT: {
            id: appId,
          },
        },
        data: {
          status: 'rejected',
          justificareRespingere: 'Auto-rejected: Student approved by another professor',
        },
      });

      return approved;
    });

    return res.status(200).json({
      success: true,
      message: 'Application approved successfully',
      data: {
        id: approvedApplication.id,
        studentId: approvedApplication.studentId,
        student: approvedApplication.student,
        sesiuneId: approvedApplication.sesiuneId,
        sesiune: approvedApplication.sesiune,
        profesorId: approvedApplication.profesorId,
        profesor: approvedApplication.profesor,
        status: approvedApplication.status,
        updatedAt: approvedApplication.updatedAt,
      },
    });
  } catch (error) {
    console.error('Application approval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/profesor/applications/:id/reject
 * Reject a student's dissertation application with justification
 */
router.patch('/applications/:id/reject', authMiddleware, profesorOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { justificare } = req.body;

    // Parse application ID
    const appId = parseInt(id);
    if (isNaN(appId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID',
      });
    }

    // Validation
    if (!justificare) {
      return res.status(400).json({
        success: false,
        message: 'Justification (justificare) is required for rejection',
      });
    }

    if (justificare.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Justification must be at least 10 characters long',
      });
    }

    // Fetch application
    const application = await prisma.cerereDisertatie.findUnique({
      where: { id: appId },
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

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Verify professor owns this application
    if (application.profesorId !== req.profesor.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this application',
      });
    }

    // Check if application is already processed
    if (application.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: `Application is already ${application.status}. Cannot change status.`,
      });
    }

    // Reject the application
    const rejectedApplication = await prisma.cerereDisertatie.update({
      where: { id: appId },
      data: {
        status: 'rejected',
        justificareRespingere: justificare,
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

    return res.status(200).json({
      success: true,
      message: 'Application rejected successfully',
      data: {
        id: rejectedApplication.id,
        studentId: rejectedApplication.studentId,
        student: rejectedApplication.student,
        sesiuneId: rejectedApplication.sesiuneId,
        sesiune: rejectedApplication.sesiune,
        profesorId: rejectedApplication.profesorId,
        profesor: rejectedApplication.profesor,
        status: rejectedApplication.status,
        justificareRespingere: rejectedApplication.justificareRespingere,
        updatedAt: rejectedApplication.updatedAt,
      },
    });
  } catch (error) {
    console.error('Application rejection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * GET /api/profesor/applications
 * List all applications for the professor's sessions
 */
router.get('/applications', authMiddleware, profesorOnly, async (req, res) => {
  try {
    const { status, sesiuneId } = req.query;

    // Build filter
    let where = {
      profesorId: req.profesor.id,
    };

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.status = status;
    }

    if (sesiuneId) {
      const sessionId = parseInt(sesiuneId);
      if (!isNaN(sessionId)) {
        where.sesiuneId = sessionId;
      }
    }

    // Fetch applications
    const applications = await prisma.cerereDisertatie.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response
    const formattedApplications = applications.map((app) => ({
      id: app.id,
      studentId: app.studentId,
      student: app.student,
      sesiuneId: app.sesiuneId,
      sesiune: app.sesiune,
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
        pending: formattedApplications.filter((a) => a.status === 'pending').length,
        approved: formattedApplications.filter((a) => a.status === 'approved').length,
        rejected: formattedApplications.filter((a) => a.status === 'rejected').length,
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
 * GET /api/profesor/applications/:id
 * Get details of a specific application
 */
router.get('/applications/:id', authMiddleware, profesorOnly, async (req, res) => {
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
        student: {
          select: {
            id: true,
            nume: true,
            prenume: true,
            user: {
              select: {
                email: true,
              },
            },
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
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Verify professor owns this application
    if (application.profesorId !== req.profesor.id) {
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
        student: application.student,
        sesiuneId: application.sesiuneId,
        sesiune: application.sesiune,
        profesorId: application.profesorId,
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
 * POST /api/profesor/applications/:id/upload-response
 * Upload response file for an approved application
 */
router.post('/applications/:id/upload-response', authMiddleware, profesorOnly, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;

    // Parse application ID
    const appId = parseInt(id);
    if (isNaN(appId)) {
      // Clean up uploaded file if exists
      if (req.file) {
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
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Verify professor owns this application
    if (application.profesorId !== req.profesor.id) {
      // Clean up file
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this application',
      });
    }

    // Check if application is approved
    if (application.status !== 'approved') {
      // Clean up file
      fs.unlinkSync(req.file.path);
      return res.status(409).json({
        success: false,
        message: 'Only approved applications can have response files uploaded',
      });
    }

    // Generate file URL
    const fileUrl = `/uploads/${req.file.filename}`;

    // Update application with file URL
    const updatedApplication = await prisma.cerereDisertatie.update({
      where: { id: appId },
      data: {
        fisierRaspunsUrl: fileUrl,
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

    return res.status(200).json({
      success: true,
      message: 'Response file uploaded successfully',
      data: {
        id: updatedApplication.id,
        fisierRaspunsUrl: updatedApplication.fisierRaspunsUrl,
        updatedAt: updatedApplication.updatedAt,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up uploaded file if exists
    if (req.file) {
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

/**
 * PATCH /api/profesor/applications/:id/un-approve
 * Reject/unapprove an approved application, requiring student to resubmit signed file
 */
router.patch('/applications/:id/un-approve', authMiddleware, profesorOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { justificare } = req.body;

    // Parse application ID
    const appId = parseInt(id);
    if (isNaN(appId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID',
      });
    }

    // Validation
    if (!justificare || !justificare.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    // Fetch application
    const application = await prisma.cerereDisertatie.findUnique({
      where: { id: appId },
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

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Verify professor owns this application
    if (application.profesorId !== req.profesor.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this application',
      });
    }

    // Check if application is approved
    if (application.status !== 'approved') {
      return res.status(409).json({
        success: false,
        message: 'Only approved applications can be rejected',
      });
    }

    // Update application: set status to rejected and clear signed file
    const rejectedApplication = await prisma.cerereDisertatie.update({
      where: { id: appId },
      data: {
        status: 'rejected',
        justificareRespingere: justificare,
        fisierSemnatUrl: null, // Clear the signed file so student must resubmit
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

    return res.status(200).json({
      success: true,
      message: 'Application rejected successfully. Student must resubmit signed file.',
      data: {
        id: rejectedApplication.id,
        studentId: rejectedApplication.studentId,
        student: rejectedApplication.student,
        sesiuneId: rejectedApplication.sesiuneId,
        sesiune: rejectedApplication.sesiune,
        profesorId: rejectedApplication.profesorId,
        profesor: rejectedApplication.profesor,
        status: rejectedApplication.status,
        justificareRespingere: rejectedApplication.justificareRespingere,
        fisierSemnatUrl: rejectedApplication.fisierSemnatUrl,
        fisierRaspunsUrl: rejectedApplication.fisierRaspunsUrl,
        updatedAt: rejectedApplication.updatedAt,
      },
    });
  } catch (error) {
    console.error('Application un-approval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

module.exports = router;
