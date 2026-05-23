const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const Course = require('../models/Course');

// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('authorId', 'name email profileImage')
      .sort({ createdAt: -1 });
    
    res.json(announcements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get announcements by course
exports.getAnnouncementsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const announcements = await Announcement.find({ course: courseId })
      .populate('authorId', 'name email profileImage')
      .sort({ createdAt: -1 });
    
    res.json(announcements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Create announcement (teacher/admin only)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, course, image, category } = req.body;

    // Debug logging: print incoming request body
    console.log('POST /api/announcements body:', JSON.stringify(req.body));

    const announcement = new Announcement({
      authorId: req.user.id,
      title,
      content,
      course,
      image,
      category: category || 'general'
    });

    await announcement.save();
    await announcement.populate('authorId', 'name email profileImage');

    // Notify all students in the course
    try {
      const courseObj = await Course.findOne({ name: course }) || await Course.findById(course);
      if (courseObj && courseObj.students) {
        const notifications = courseObj.students.map(studentId => ({
          userId: studentId,
          type: 'announcement',
          title: 'New Announcement',
          description: `New announcement: "${title}" in course ${courseObj.name}.`
        }));
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    } catch (notifErr) {
      console.error('Failed to send announcement notifications:', notifErr);
    }

    // Debug logging: print saved announcement
    console.log('Saved announcement:', JSON.stringify(announcement));

    res.status(201).json(announcement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Add comment to announcement
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }

    announcement.comments.push({
      userId: req.user.id,
      userName: req.body.userName,
      text
    });

    await announcement.save();
    res.json(announcement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Like announcement
exports.likeAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }

    announcement.likes += 1;
    await announcement.save();
    
    res.json(announcement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    let announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }

    // Only author or admin/teacher can update
    if (announcement.authorId.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher') {
      console.log(`Update blocked. Author: ${announcement.authorId}, User: ${req.user.id}, Role: ${req.user.role}`);
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const { title, content, category, course } = req.body;
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (category) announcement.category = category;
    if (course) announcement.course = course;

    await announcement.save();
    await announcement.populate('authorId', 'name email profileImage');

    res.json(announcement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }

    // Only author or admin/teacher can delete
    if (announcement.authorId.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher') {
      console.log(`Delete blocked. Author: ${announcement.authorId}, User: ${req.user.id}, Role: ${req.user.role}`);
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Announcement removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
