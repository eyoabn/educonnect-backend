const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, conversationId, text } = req.body;

    const message = new Message({
      senderId: req.user.id,
      receiverId,
      conversationId,
      text
    });

    await message.save();
    await message.populate('senderId', 'name email profileImage');

    // Notify receiver
    try {
      const sender = await User.findById(req.user.id);
      const notif = new Notification({
        userId: receiverId,
        type: 'message',
        title: 'New Message',
        description: `You received a new message from ${sender ? sender.name : 'someone'}.`
      });
      await notif.save();
    } catch (notifErr) {
      console.error('Failed to send message notification:', notifErr);
    }
    
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get messages from a conversation
exports.getConversation = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('senderId', 'name email profileImage')
      .sort({ timestamp: -1 });
    
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      { conversationId: req.params.conversationId, read: false },
      { read: true }
    );
    res.json({ msg: 'Messages marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get all conversations for user
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Message.find({
      $or: [
        { senderId: req.user.id },
        { receiverId: req.user.id }
      ]
    })
    .populate('senderId', 'name email profileImage')
    .populate('receiverId', 'name email profileImage')
    .sort({ timestamp: -1 })
    .limit(50);
    
    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
