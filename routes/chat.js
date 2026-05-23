const express = require('express');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/chat/send
// @desc    Send a message
// @access  Private
router.post('/send', auth, chatController.sendMessage);

// @route   GET /api/chat/contacts
// @desc    Get unified contacts list (assigned teachers/students + past conversations)
// @access  Private
router.get('/contacts', auth, chatController.getContacts);

// @route   GET /api/chat/conversations
// @desc    Get all conversations for user (latest message per conversation)
// @access  Private
router.get('/conversations', auth, chatController.getConversations);

// @route   GET /api/chat/messages/:otherUserId
// @desc    Get messages between me and another user
// @access  Private
router.get('/messages/:otherUserId', auth, chatController.getMessages);

// @route   GET /api/chat/conversation/:conversationId
// @desc    Get messages from a conversation (legacy)
// @access  Private
router.get('/conversation/:conversationId', auth, chatController.getConversation);

// @route   PUT /api/chat/read/:conversationId
// @desc    Mark messages as read
// @access  Private
router.put('/read/:conversationId', auth, chatController.markAsRead);

// @route   GET /api/chat/assigned-teachers
// @desc    Get teachers assigned to the current student's courses
// @access  Private
router.get('/assigned-teachers', auth, chatController.getAssignedTeachers);

// @route   GET /api/chat/assigned-students
// @desc    Get students in the current teacher's courses
// @access  Private
router.get('/assigned-students', auth, chatController.getAssignedStudents);

module.exports = router;
