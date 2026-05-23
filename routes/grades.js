const express = require('express');
const gradesController = require('../controllers/gradesController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/grades/student/:studentId
// @desc    Get all grades for a student
// @access  Private
router.get('/student/:studentId', auth, gradesController.getStudentGrades);

// @route   GET /api/grades/course/:course
// @desc    Get all grades for a course
// @access  Private
router.get('/course/:course', auth, gradesController.getCourseGrades);

// @route   POST /api/grades
// @desc    Create a new grade
// @access  Private (Teacher/Admin)
router.post('/', auth, gradesController.createGrade);

// @route   POST /api/grades/assignment
// @desc    Create a new assignment for all students in a course
// @access  Private (Teacher/Admin)
router.post('/assignment', auth, gradesController.createAssignment);

// @route   POST /api/grades/upload
// @desc    Upload a file to Cloudinary and return its URL
// @access  Private (Student)
router.post('/upload', auth, (req, res, next) => {
  const { upload } = require('../config/cloudinary');
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, gradesController.uploadFile);

// @route   PUT /api/grades/submit/:id
// @desc    Submit assignment details as a student
// @access  Private
router.put('/submit/:id', auth, gradesController.submitAssignment);

// @route   PUT /api/grades/grade/:id
// @desc    Grade a submission
// @access  Private (Teacher/Admin)
router.put('/grade/:id', auth, gradesController.gradeSubmission);

// @route   PUT /api/grades/:id
// @desc    Update a grade
// @access  Private (Teacher/Admin)
router.put('/:id', auth, gradesController.updateGrade);

module.exports = router;
