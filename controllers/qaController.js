const Question = require('../models/Question');
const Notification = require('../models/Notification');
const Course = require('../models/Course');

exports.getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ courseId: req.params.courseId })
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const { title, content, courseId } = req.body;
    
    const question = new Question({
      title,
      content,
      courseId,
      authorId: req.user.id,
      authorName: req.user.name || 'Student'
    });
    await question.save();

    // Notify teacher of the course
    const course = await Course.findById(courseId);
    if (course && course.teacher && course.teacher.toString() !== req.user.id) {
      const notif = new Notification({
        userId: course.teacher,
        type: 'qa',
        title: 'New Question',
        description: `${req.user.name || 'A student'} asked a question: ${title}`
      });
      await notif.save();
    }

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.postAnswer = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const answer = {
      authorId: req.user.id,
      authorName: req.user.name || 'User',
      content: req.body.content
    };
    
    question.answers.push(answer);
    await question.save();

    // Notify author of the question
    if (question.authorId.toString() !== req.user.id) {
      const notif = new Notification({
        userId: question.authorId,
        type: 'qa',
        title: 'New Answer',
        description: `${req.user.name || 'User'} answered your question: ${question.title}`
      });
      await notif.save();
    }

    res.json(question);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
