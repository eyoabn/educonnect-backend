const express = require('express');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/chat/send
// @desc    Send a message
// @access  Private
router.post('/send', auth, chatController.sendMessage);

// @route   GET /api/chat/conversation/:conversationId
// @desc    Get messages from a conversation
// @access  Private
router.get('/conversation/:conversationId', auth, chatController.getConversation);

// @route   PUT /api/chat/read/:conversationId
// @desc    Mark messages as read
// @access  Private
router.put('/read/:conversationId', auth, chatController.markAsRead);

// @route   GET /api/chat/conversations
// @desc    Get all conversations for user
// @access  Private
router.get('/conversations', auth, chatController.getConversations);

module.exports = router;
