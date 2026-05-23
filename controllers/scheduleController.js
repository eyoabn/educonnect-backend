const Schedule = require('../models/Schedule');
const Course = require('../models/Course');

exports.getScheduleByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    let course;
    if (courseId.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(courseId);
    } else {
      course = await Course.findOne({ name: courseId });
    }

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const schedule = await Schedule.find({ course: course._id }).sort({ day: 1, time: 1 });
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching schedule', details: error.message });
  }
};

exports.createScheduleItem = async (req, res) => {
  try {
    const { course, time, day, room, type, duration } = req.body;
    
    const courseObj = await Course.findById(course);
    if (!courseObj) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const newScheduleItem = new Schedule({
      course: courseObj._id,
      time,
      day,
      room,
      type,
      duration: duration || 60
    });

    const savedItem = await newScheduleItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating schedule item', details: error.message });
  }
};

exports.deleteScheduleItem = async (req, res) => {
  try {
    const { id } = req.params;
    await Schedule.findByIdAndDelete(id);
    res.json({ message: 'Schedule item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting schedule item', details: error.message });
  }
};
