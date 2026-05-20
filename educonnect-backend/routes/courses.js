const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
const auth = require('../middleware/auth');

// Get all courses for authenticated user
router.get('/', auth, coursesController.getCourses);

// Get course by ID
router.get('/:id', auth, coursesController.getCourseById);

// Create new course
router.post('/', auth, coursesController.createCourse);

// Update course
router.put('/:id', auth, coursesController.updateCourse);

module.exports = router;
