const express = require('express');
const announcementsController = require('../controllers/announcementsController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/announcements
// @desc    Get all announcements
// @access  Private
router.get('/', auth, announcementsController.getAnnouncements);

// @route   GET /api/announcements/course/:courseId
// @desc    Get announcements for a specific course
// @access  Private
router.get('/course/:courseId', auth, announcementsController.getAnnouncementsByCourse);

// @route   POST /api/announcements
// @desc    Create an announcement
// @access  Private (Teacher/Admin)
router.post('/', auth, announcementsController.createAnnouncement);

// @route   POST /api/announcements/:id/comment
// @desc    Add comment to announcement
// @access  Private
router.post('/:id/comment', auth, announcementsController.addComment);

// @route   PUT /api/announcements/:id/like
// @desc    Like an announcement
// @access  Private
router.put('/:id/like', auth, announcementsController.likeAnnouncement);

// @route   PUT /api/announcements/:id
// @desc    Update an announcement
// @access  Private (Teacher/Admin)
router.put('/:id', auth, announcementsController.updateAnnouncement);

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement
// @access  Private (Teacher/Admin)
router.delete('/:id', auth, announcementsController.deleteAnnouncement);

module.exports = router;
