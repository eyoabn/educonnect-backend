const Grade = require('../models/Grade');
const Notification = require('../models/Notification');

// Get all grades for a student
exports.getStudentGrades = async (req, res) => {
  try {
    const grades = await Grade.find({ studentId: req.params.studentId })
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(grades);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Create a grade (teacher only)
exports.createGrade = async (req, res) => {
  try {
    const { studentId, assignmentName, course, grade, feedback } = req.body;

    const newGrade = new Grade({
      studentId,
      assignmentName,
      course,
      grade,
      feedback,
      status: grade ? 'graded' : 'pending',
      teacherId: req.user.id,
      gradedDate: new Date()
    });

    await newGrade.save();

    // Notify student
    try {
      const notif = new Notification({
        userId: studentId,
        type: 'grade',
        title: 'New Grade Posted',
        description: `Your grade for assignment "${assignmentName}" in ${course} has been posted.`
      });
      await notif.save();
    } catch (notifErr) {
      console.error('Failed to send grade notification:', notifErr);
    }

    res.json(newGrade);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update a grade
exports.updateGrade = async (req, res) => {
  try {
    let grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({ msg: 'Grade not found' });
    }

    grade = await Grade.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    // Notify student
    try {
      const notif = new Notification({
        userId: grade.studentId,
        type: 'grade',
        title: 'Grade Updated',
        description: `Your grade for assignment "${grade.assignmentName}" in ${grade.course} has been updated.`
      });
      await notif.save();
    } catch (notifErr) {
      console.error('Failed to send grade update notification:', notifErr);
    }

    res.json(grade);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get all grades for a course (teacher)
exports.getCourseGrades = async (req, res) => {
  try {
    const Course = require('../models/Course');
    let courseName = req.params.course;
    try {
      const courseObj = await Course.findById(req.params.course) || await Course.findOne({ name: req.params.course });
      if (courseObj) {
        courseName = courseObj.name;
      }
    } catch (_) {
      const courseObj = await Course.findOne({ name: req.params.course });
      if (courseObj) {
        courseName = courseObj.name;
      }
    }

    const grades = await Grade.find({ course: courseName })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(grades);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Create a new assignment for all students in a course
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, points, due, course } = req.body;
    const Course = require('../models/Course');
    
    // Find the course by name or ID
    const CourseObj = await Course.findOne({ name: course }) || await Course.findById(course);
    if (!CourseObj) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    const students = CourseObj.students || [];
    
    // Create a pending Grade document for every student in the course
    const gradesToCreate = students.map(studentId => ({
      studentId,
      assignmentName: title,
      course: CourseObj.name,
      maxGrade: points || 100,
      description: description || '',
      status: 'pending',
      feedback: '',
      due: due || ''
    }));

    let createdGrades = [];
    if (gradesToCreate.length > 0) {
      createdGrades = await Grade.insertMany(gradesToCreate);

      // Notify students of the new assignment
      const notifications = students.map(studentId => ({
        userId: studentId,
        type: 'grade',
        title: 'New Assignment Assigned',
        description: `New assignment "${title}" is due on ${due || 'TBD'} for ${CourseObj.name}.`
      }));
      await Notification.insertMany(notifications);
    }

    res.json({ success: true, createdCount: createdGrades.length, createdGrades });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Submit assignment details as a student
exports.submitAssignment = async (req, res) => {
  try {
    const { content } = req.body;
    let grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({ msg: 'Assignment record not found' });
    }

    grade.status = 'submitted';
    grade.submissionContent = content || '';
    grade.submittedDate = new Date();

    await grade.save();
    res.json({ success: true, grade });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Grade a student's submission
exports.gradeSubmission = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    let grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({ msg: 'Submission not found' });
    }

    grade.grade = score;
    grade.feedback = feedback || '';
    grade.status = 'graded';
    grade.gradedDate = new Date();
    grade.teacherId = req.user.id;

    await grade.save();

    // Notify student
    try {
      const notif = new Notification({
        userId: grade.studentId,
        type: 'grade',
        title: 'Assignment Graded',
        description: `Your submission for "${grade.assignmentName}" has been graded: ${score}%.`
      });
      await notif.save();
    } catch (notifErr) {
      console.error('Failed to send notification:', notifErr);
    }

    res.json({ success: true, grade });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
