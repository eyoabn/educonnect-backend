const User = require('../models/User');
const Course = require('../models/Course');
const Announcement = require('../models/Announcement');
const Question = require('../models/Question');

exports.getUsers = async (req, res) => {
  try {
    const role = req.query.role;
    const filter = {};
    if (role === 'teacher' || role === 'student') {
      filter.role = role;
    } else {
      filter.role = { $in: ['student', 'teacher'] };
    }

    const users = await User.find(filter).select('-password').lean();
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error', error: err.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name email')
      .populate('students', 'name email');
    res.json({ success: true, courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error', error: err.message });
  }
};

exports.assignTeacher = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, msg: 'Course not found' });

    const { teacherId } = req.body;
    if (!teacherId) return res.status(400).json({ success: false, msg: 'teacherId is required' });

    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) return res.status(400).json({ success: false, msg: 'Teacher not found' });

    course.teacher = teacherId;
    await course.save();
    await course.populate('teacher', 'name email');

    res.json({ success: true, course, msg: 'Teacher assigned to course successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error', error: err.message });
  }
};
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    if (user.role !== 'teacher' && user.role !== 'student') {
      return res.status(400).json({ success: false, msg: 'Only students and teachers can be approved' });
    }

    user.approved = true;
    await user.save();

    const responseUser = user.toObject();
    delete responseUser.password;

    res.json({ success: true, user: responseUser, msg: 'User approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error', error: err.message });
  }
};
exports.assignStudents = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, msg: 'Course not found' });

    const { studentIds } = req.body;
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ success: false, msg: 'studentIds array is required' });
    }

    const students = await User.find({ _id: { $in: studentIds }, role: 'student' }).select('_id name email');
    const validIds = students.map(s => s._id.toString());

    course.students = validIds;
    await course.save();
    await course.populate('students', 'name email');

    res.json({ success: true, course, msg: 'Students assigned to course successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    if (user.role !== 'teacher' && user.role !== 'student') {
      return res.status(400).json({ success: false, msg: 'Only students and teachers can be deleted' });
    }

    if (user.role === 'student') {
      await Course.updateMany({ students: user._id }, { $pull: { students: user._id } });
    } else if (user.role === 'teacher') {
      await Course.updateMany({ teacher: user._id }, { $unset: { teacher: '' } });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: `${user.name} has been removed successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error', error: err.message });
  }
};

// Admin delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, msg: 'Announcement not found' });
    }
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: 'Announcement deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error', error: err.message });
  }
};

// Admin delete question
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, msg: 'Question not found' });
    }
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: 'Question deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error', error: err.message });
  }
};

// Admin delete answer
exports.deleteAnswer = async (req, res) => {
  try {
    const { questionId, answerId } = req.params;
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, msg: 'Question not found' });
    }
    question.answers = question.answers.filter(ans => ans._id.toString() !== answerId);
    await question.save();
    res.json({ success: true, msg: 'Answer deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error', error: err.message });
  }
};

// Admin create course
exports.createCourse = async (req, res) => {
  try {
    const { name, teacherId, targetClasses } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, msg: 'Course name is required' });
    }

    let classesArray = [];
    if (targetClasses) {
      if (Array.isArray(targetClasses)) {
        classesArray = targetClasses;
      } else if (typeof targetClasses === 'string') {
        classesArray = targetClasses.split(',').map(c => c.trim()).filter(c => c !== '');
      }
    }

    const newCourse = new Course({
      name,
      teacher: teacherId || null,
      students: [],
      pending: [],
      targetClasses: classesArray,
      avgGrade: 0,
      progress: 0
    });

    const course = await newCourse.save();
    if (teacherId) {
      await course.populate('teacher', 'name email');
    }

    res.json({ success: true, course, msg: 'Course created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server error', error: err.message });
  }
};