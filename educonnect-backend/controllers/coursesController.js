const Course = require('../models/Course');
const User = require('../models/User');

// Get all courses for a user
exports.getCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    let courses;
    if (user.role === 'teacher') {
      // Teachers should only see courses assigned to them.
      courses = await Course.find({ teacher: userId })
        .populate('teacher', 'name email')
        .populate('students', 'name email')
        .populate('pending', 'name email');
    } else {
      courses = await Course.find({ 
        $or: [{ students: userId }, { pending: userId }] 
      })
        .populate('teacher', 'name email')
        .populate('students', 'name email')
        .populate('pending', 'name email');
    }

    res.json({ success: true, courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .populate('pending', 'name email');

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    res.json({ success: true, course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Create new course
exports.createCourse = async (req, res) => {
  try {
    const { name } = req.body;
    const teacherId = req.user.id;

    if (!name) {
      return res.status(400).json({ msg: 'Course name is required' });
    }

    const newCourse = new Course({
      name,
      teacher: teacherId,
      students: [],
      pending: [],
      avgGrade: 0,
      progress: 0
    });

    const course = await newCourse.save();
    await course.populate('teacher', 'name email');

    res.json({ success: true, course, msg: 'Course created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const { name, avgGrade, progress } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user is the teacher
    if (course.teacher.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this course' });
    }

    if (name) course.name = name;
    if (typeof avgGrade !== 'undefined') course.avgGrade = avgGrade;
    if (typeof progress !== 'undefined') course.progress = progress;

    await course.save();
    res.json({ success: true, course, msg: 'Course updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
