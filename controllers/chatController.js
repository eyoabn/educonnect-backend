const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Course = require('../models/Course');

// ── Helper: build a stable conversation ID from two user IDs ─────────────────
function buildConversationId(id1, id2) {
  return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
}

// ── Helper: build avatar initials from a name ────────────────────────────────
function initials(name) {
  return (name || 'U')
    .split(' ')
    .map(w => (w[0] || '').toUpperCase())
    .slice(0, 2)
    .join('');
}

// ── Helper: deterministic gradient index from a string ───────────────────────
function gradientIndex(str) {
  let n = 0;
  for (const c of (str || '')) n += c.charCodeAt(0);
  return n % 4;
}

// POST /api/chat/send
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({ msg: 'receiverId and text are required' });
    }

    const conversationId = buildConversationId(
      req.user.id.toString(),
      receiverId.toString()
    );

    const message = new Message({
      senderId: req.user.id,
      receiverId,
      conversationId,
      text,
    });

    await message.save();
    await message.populate('senderId', 'name email');
    await message.populate('receiverId', 'name email');

    // Send a notification to the receiver (best-effort)
    try {
      const sender = await User.findById(req.user.id).select('name');
      const notif = new Notification({
        userId: receiverId,
        type: 'message',
        title: 'New Message',
        description: `You have a new message from ${sender ? sender.name : 'someone'}.`,
      });
      await notif.save();
    } catch (notifErr) {
      console.error('Notification error (non-fatal):', notifErr.message);
    }

    res.json(message);
  } catch (err) {
    console.error('sendMessage error:', err.message);
    res.status(500).send('Server error');
  }
};

// GET /api/chat/conversation/:conversationId
exports.getConversation = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ timestamp: 1 }); // oldest first

    res.json(messages);
  } catch (err) {
    console.error('getConversation error:', err.message);
    res.status(500).send('Server error');
  }
};

// GET /api/chat/messages/:otherUserId  ← get messages between me and another user
exports.getMessages = async (req, res) => {
  try {
    const myId = req.user.id.toString();
    const otherId = req.params.otherUserId.toString();
    const conversationId = buildConversationId(myId, otherId);

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ timestamp: 1 }); // oldest first

    res.json(messages);
  } catch (err) {
    console.error('getMessages error:', err.message);
    res.status(500).send('Server error');
  }
};

// PUT /api/chat/read/:conversationId
exports.markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      {
        conversationId: req.params.conversationId,
        receiverId: req.user.id,
        read: false,
      },
      { read: true }
    );
    res.json({ msg: 'Messages marked as read' });
  } catch (err) {
    console.error('markAsRead error:', err.message);
    res.status(500).send('Server error');
  }
};

// GET /api/chat/conversations  ← list all conversations for the current user
exports.getConversations = async (req, res) => {
  try {
    const myId = req.user.id;

    // Find the latest message in every conversation that involves the user
    const messages = await Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }],
    })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(200);

    // Keep only the newest message per conversationId
    const seen = new Map();
    for (const m of messages) {
      if (!seen.has(m.conversationId)) seen.set(m.conversationId, m);
    }

    res.json([...seen.values()]);
  } catch (err) {
    console.error('getConversations error:', err.message);
    res.status(500).send('Server error');
  }
};

// GET /api/chat/contacts  ← unified contacts list for current user
exports.getContacts = async (req, res) => {
  try {
    const myId = req.user.id;
    const me = await User.findById(myId).select('role name');
    if (!me) return res.status(401).json({ msg: 'User not found' });

    const contactsMap = new Map();

    // Load role-specific contacts first (so they appear even without messages)
    if (me.role === 'student') {
      // Teachers from courses the student is enrolled in
      const courses = await Course.find({ students: myId }).populate(
        'teacher',
        'name email role'
      );
      for (const course of courses) {
        if (!course.teacher) continue;
        const tId = course.teacher._id.toString();
        if (!contactsMap.has(tId)) {
          contactsMap.set(tId, {
            id: tId,
            name: course.teacher.name || 'Teacher',
            role: 'teacher',
            avatar: initials(course.teacher.name),
            online: false,
            unread: 0,
            lastMessage: 'Start a conversation',
            gradientIndex: gradientIndex(tId),
          });
        }
      }
    } else if (me.role === 'teacher') {
      // Students enrolled in courses this teacher teaches
      const courses = await Course.find({ teacher: myId }).populate(
        'students',
        'name email role'
      );
      for (const course of courses) {
        for (const student of course.students || []) {
          const sId = student._id.toString();
          if (!contactsMap.has(sId)) {
            contactsMap.set(sId, {
              id: sId,
              name: student.name || 'Student',
              role: 'student',
              avatar: initials(student.name),
              online: false,
              unread: 0,
              lastMessage: 'Start a conversation',
              gradientIndex: gradientIndex(sId),
            });
          }
        }
      }
    }

    // Overlay last-message data from conversation history
    const messages = await Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }],
    })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(200);

    const seenConv = new Set();
    for (const m of messages) {
      if (seenConv.has(m.conversationId)) continue;
      seenConv.add(m.conversationId);

      const isSender = m.senderId._id.toString() === myId.toString();
      const other = isSender ? m.receiverId : m.senderId;
      if (!other) continue;

      const otherId = other._id.toString();
      const unread = !m.read && !isSender ? 1 : 0;

      if (contactsMap.has(otherId)) {
        const existing = contactsMap.get(otherId);
        existing.lastMessage = m.text || '';
        existing.unread = Math.max(existing.unread, unread);
      } else {
        contactsMap.set(otherId, {
          id: otherId,
          name: other.name || 'User',
          role: other.role || 'user',
          avatar: initials(other.name),
          online: false,
          unread,
          lastMessage: m.text || '',
          gradientIndex: gradientIndex(otherId),
        });
      }
    }

    res.json([...contactsMap.values()]);
  } catch (err) {
    console.error('getContacts error:', err.message);
    res.status(500).send('Server error');
  }
};

// GET /api/chat/assigned-teachers  ← teachers for a student
exports.getAssignedTeachers = async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user.id }).populate(
      'teacher',
      'name email role'
    );

    const teachers = [];
    const seen = new Set();
    for (const course of courses) {
      if (!course.teacher) continue;
      const tId = course.teacher._id.toString();
      if (!seen.has(tId)) {
        seen.add(tId);
        teachers.push({
          id: tId,
          name: course.teacher.name || 'Teacher',
          role: 'teacher',
          avatar: initials(course.teacher.name),
          online: false,
          unread: 0,
          lastMessage: 'Start a conversation',
          gradientIndex: gradientIndex(tId),
        });
      }
    }

    res.json(teachers);
  } catch (err) {
    console.error('getAssignedTeachers error:', err.message);
    res.status(500).send('Server error');
  }
};

// GET /api/chat/assigned-students  ← students for a teacher
exports.getAssignedStudents = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user.id }).populate(
      'students',
      'name email role'
    );

    const students = [];
    const seen = new Set();
    for (const course of courses) {
      for (const student of course.students || []) {
        const sId = student._id.toString();
        if (!seen.has(sId)) {
          seen.add(sId);
          students.push({
            id: sId,
            name: student.name || 'Student',
            role: 'student',
            avatar: initials(student.name),
            online: false,
            unread: 0,
            lastMessage: 'Start a conversation',
            gradientIndex: gradientIndex(sId),
          });
        }
      }
    }

    res.json(students);
  } catch (err) {
    console.error('getAssignedStudents error:', err.message);
    res.status(500).send('Server error');
  }
};
