const express = require('express');
const materialsController = require('../controllers/materialsController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/materials/:course
// @desc    Get all materials for a course
// @access  Private
router.get('/course/:course', auth, materialsController.getMaterials);

// @route   POST /api/materials
// @desc    Upload a material
// @access  Private (Teacher/Admin)
router.post('/', auth, materialsController.uploadMaterial);

// @route   PUT /api/materials/:id
// @desc    Update a material (add version)
// @access  Private (Teacher/Admin)
router.put('/:id', auth, materialsController.updateMaterial);

// @route   GET /api/materials/search
// @desc    Search materials
// @access  Private
router.get('/search', auth, materialsController.searchMaterials);

module.exports = router;
