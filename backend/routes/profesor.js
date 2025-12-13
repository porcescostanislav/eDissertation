const express = require('express');
const { prisma } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

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
 * Check if a date range overlaps with existing sessions
 * @param {Date} dataInceput - Start date
 * @param {Date} dataSfarsit - End date
 * @param {number} profesorId - Professor ID
 * @param {number} excludeSessionId - Session ID to exclude from check (for updates)
 * @returns {Promise<boolean>} - True if overlap exists
 */
async function checkSessionOverlap(dataInceput, dataSfarsit, profesorId, excludeSessionId = null) {
  const existingSessions = await prisma.sesiuneInscriere.findMany({
    where: {
      profesorId,
      ...(excludeSessionId && { NOT: { id: excludeSessionId } }),
    },
  });

  for (const session of existingSessions) {
    // Check if new session overlaps with existing session
    // Overlap occurs if: new_start < existing_end AND new_end > existing_start
    if (dataInceput < session.dataSfarsit && dataSfarsit > session.dataInceput) {
      return true;
    }
  }

  return false;
}

/**
 * POST /api/profesor/sessions
 * Create a new enrollment session for a professor
 */
router.post('/sessions', authMiddleware, profesorOnly, async (req, res) => {
  try {
    const { dataInceput, dataSfarsit, limitaStudenti } = req.body;

    // Validation
    if (!dataInceput || !dataSfarsit || limitaStudenti === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: dataInceput, dataSfarsit, limitaStudenti',
      });
    }

    // Parse dates
    const startDate = new Date(dataInceput);
    const endDate = new Date(dataSfarsit);

    // Validate date format
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss)',
      });
    }

    // Validate date range
    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'Session start date must be before end date',
      });
    }

    // Validate student limit
    if (limitaStudenti < 1) {
      return res.status(400).json({
        success: false,
        message: 'Student limit must be at least 1',
      });
    }

    // Validate profesor's student limit
    if (limitaStudenti > req.profesor.limitaStudenti) {
      return res.status(400).json({
        success: false,
        message: `Student limit cannot exceed professor's maximum limit of ${req.profesor.limitaStudenti}`,
      });
    }

    // Check for temporal overlaps
    const hasOverlap = await checkSessionOverlap(startDate, endDate, req.profesor.id);

    if (hasOverlap) {
      return res.status(409).json({
        success: false,
        message: 'New session overlaps with an existing session. Please choose different dates.',
      });
    }

    // Create session
    const session = await prisma.sesiuneInscriere.create({
      data: {
        profesorId: req.profesor.id,
        dataInceput: startDate,
        dataSfarsit: endDate,
        limitaStudenti,
      },
      include: {
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
      message: 'Session created successfully',
      data: {
        id: session.id,
        profesorId: session.profesorId,
        profesor: session.profesor,
        dataInceput: session.dataInceput,
        dataSfarsit: session.dataSfarsit,
        limitaStudenti: session.limitaStudenti,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * GET /api/profesor/sessions
 * List all enrollment sessions for the authenticated professor
 */
router.get('/sessions', authMiddleware, profesorOnly, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const now = new Date();

    // Build filter
    let where = {
      profesorId: req.profesor.id,
    };

    if (status === 'active') {
      where = {
        ...where,
        dataInceput: { lte: now },
        dataSfarsit: { gte: now },
      };
    } else if (status === 'upcoming') {
      where = {
        ...where,
        dataInceput: { gt: now },
      };
    } else if (status === 'past') {
      where = {
        ...where,
        dataSfarsit: { lt: now },
      };
    }

    // Fetch sessions with enrollment count
    const sessions = await prisma.sesiuneInscriere.findMany({
      where,
      include: {
        _count: {
          select: { 
            cerereDisertatie: {
              where: {
                status: 'approved' // Only count approved applications as enrolled
              }
            }
          },
        },
      },
      orderBy: {
        dataInceput: 'desc',
      },
    });

    // Format response
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      profesorId: session.profesorId,
      dataInceput: session.dataInceput,
      dataSfarsit: session.dataSfarsit,
      limitaStudenti: session.limitaStudenti,
      enrolledCount: session._count.cerereDisertatie,
      availableSlots: session.limitaStudenti - session._count.cerereDisertatie,
      status:
        session.dataInceput > now
          ? 'upcoming'
          : session.dataSfarsit < now
            ? 'past'
            : 'active',
      createdAt: session.createdAt,
    }));

    return res.status(200).json({
      success: true,
      message: 'Sessions retrieved successfully',
      data: formattedSessions,
      pagination: {
        total: formattedSessions.length,
      },
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * GET /api/profesor/sessions/:id
 * Get details of a specific enrollment session
 */
router.get('/sessions/:id', authMiddleware, profesorOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Parse session ID
    const sessionId = parseInt(id);
    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID',
      });
    }

    // Fetch session
    const session = await prisma.sesiuneInscriere.findUnique({
      where: { id: sessionId },
      include: {
        profesor: {
          select: {
            id: true,
            nume: true,
            prenume: true,
          },
        },
        cerereDisertatie: {
          select: {
            id: true,
            student: {
              select: {
                id: true,
                nume: true,
                prenume: true,
              },
            },
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Verify ownership
    if (session.profesorId !== req.profesor.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this session',
      });
    }

    const now = new Date();

    return res.status(200).json({
      success: true,
      message: 'Session retrieved successfully',
      data: {
        id: session.id,
        profesorId: session.profesorId,
        profesor: session.profesor,
        dataInceput: session.dataInceput,
        dataSfarsit: session.dataSfarsit,
        limitaStudenti: session.limitaStudenti,
        enrolledCount: session.cerereDisertatie.length,
        availableSlots: session.limitaStudenti - session.cerereDisertatie.length,
        status:
          session.dataInceput > now
            ? 'upcoming'
            : session.dataSfarsit < now
              ? 'past'
              : 'active',
        enrollments: session.cerereDisertatie,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error('Session detail retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * PUT /api/profesor/sessions/:id
 * Update an enrollment session (only if no enrollments or session hasn't started)
 */
router.put('/sessions/:id', authMiddleware, profesorOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { dataInceput, dataSfarsit, limitaStudenti } = req.body;

    // Parse session ID
    const sessionId = parseInt(id);
    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID',
      });
    }

    // Fetch session
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

    // Verify ownership
    if (session.profesorId !== req.profesor.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this session',
      });
    }

    // Check if session has started
    const now = new Date();
    if (session.dataInceput <= now) {
      return res.status(409).json({
        success: false,
        message: 'Cannot update a session that has already started',
      });
    }

    // Prepare update data
    const updateData = {};

    if (dataInceput || dataSfarsit) {
      const startDate = dataInceput ? new Date(dataInceput) : session.dataInceput;
      const endDate = dataSfarsit ? new Date(dataSfarsit) : session.dataSfarsit;

      // Validate date format
      if ((dataInceput && isNaN(startDate.getTime())) || (dataSfarsit && isNaN(endDate.getTime()))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss)',
        });
      }

      // Validate date range
      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'Session start date must be before end date',
        });
      }

      // Check for overlaps with other sessions
      const hasOverlap = await checkSessionOverlap(startDate, endDate, req.profesor.id, sessionId);
      if (hasOverlap) {
        return res.status(409).json({
          success: false,
          message: 'Updated session dates would overlap with another session',
        });
      }

      updateData.dataInceput = startDate;
      updateData.dataSfarsit = endDate;
    }

    if (limitaStudenti !== undefined) {
      if (limitaStudenti < 1) {
        return res.status(400).json({
          success: false,
          message: 'Student limit must be at least 1',
        });
      }

      if (limitaStudenti > req.profesor.limitaStudenti) {
        return res.status(400).json({
          success: false,
          message: `Student limit cannot exceed professor's maximum limit of ${req.profesor.limitaStudenti}`,
        });
      }

      // Check if new limit accommodates current enrollments
      if (limitaStudenti < session._count.cerereDisertatie) {
        return res.status(409).json({
          success: false,
          message: `Cannot reduce student limit below current enrollment count (${session._count.cerereDisertatie})`,
        });
      }

      updateData.limitaStudenti = limitaStudenti;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    // Update session
    const updatedSession = await prisma.sesiuneInscriere.update({
      where: { id: sessionId },
      data: updateData,
      include: {
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
      message: 'Session updated successfully',
      data: {
        id: updatedSession.id,
        profesorId: updatedSession.profesorId,
        profesor: updatedSession.profesor,
        dataInceput: updatedSession.dataInceput,
        dataSfarsit: updatedSession.dataSfarsit,
        limitaStudenti: updatedSession.limitaStudenti,
        createdAt: updatedSession.createdAt,
      },
    });
  } catch (error) {
    console.error('Session update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/profesor/sessions/:id
 * Delete an enrollment session (only if no enrollments)
 */
router.delete('/sessions/:id', authMiddleware, profesorOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Parse session ID
    const sessionId = parseInt(id);
    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID',
      });
    }

    // Fetch session
    const session = await prisma.sesiuneInscriere.findUnique({
      where: { id: sessionId },
      include: {
        _count: {
          select: { 
            cerereDisertatie: {
              where: {
                status: 'approved' // Only count approved applications as enrolled
              }
            }
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Verify ownership
    if (session.profesorId !== req.profesor.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this session',
      });
    }

    // Check for enrollments
    if (session._count.cerereDisertatie > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete session with ${session._count.cerereDisertatie} student(s) enrolled. Please contact an administrator to force delete this session.`,
      });
    }

    // Delete session
    await prisma.sesiuneInscriere.delete({
      where: { id: sessionId },
    });

    return res.status(200).json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Session deletion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * GET /api/profesor/sessions/:sessionId/enrolled-students
 * Get all enrolled students for a specific session
 */
router.get('/sessions/:sessionId/enrolled-students', authMiddleware, profesorOnly, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Parse session ID
    const sessionIdInt = parseInt(sessionId);
    if (isNaN(sessionIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID',
      });
    }

    // Verify professor owns this session
    const session = await prisma.sesiuneInscriere.findUnique({
      where: { id: sessionIdInt },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.profesorId !== req.profesor.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this session',
      });
    }

    // Fetch enrolled students for this session
    const enrolledStudents = await prisma.cerereDisertatie.findMany({
      where: {
        sesiuneId: sessionIdInt,
        status: 'approved', // Only approved applications mean enrolled
      },
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
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`Enrolled students for session ${sessionIdInt}:`, enrolledStudents);

    // Format response
    const formattedStudents = enrolledStudents.map((app) => ({
      applicationId: app.id,
      studentId: app.student.id,
      studentName: `${app.student.prenume} ${app.student.nume}`,
      studentEmail: app.student.user?.email,
      status: app.status,
      enrolledDate: app.updatedAt,
    }));

    console.log(`Formatted students:`, formattedStudents);

    return res.status(200).json({
      success: true,
      message: 'Enrolled students retrieved successfully',
      data: formattedStudents,
      pagination: {
        total: formattedStudents.length,
      },
    });
  } catch (error) {
    console.error('Enrolled students retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

module.exports = router;
