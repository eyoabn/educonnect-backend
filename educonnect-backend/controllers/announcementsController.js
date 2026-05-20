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
    const { title, content, course, image } = req.body;

    // Debug logging: print incoming request body
    console.log('POST /api/announcements body:', JSON.stringify(req.body));

    const announcement = new Announcement({
      authorId: req.user.id,
      title,
      content,
      course,
      image
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
