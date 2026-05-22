const Material = require('../models/Material');
const Notification = require('../models/Notification');
const Course = require('../models/Course');

// Get all materials for a course
exports.getMaterials = async (req, res) => {
  try {
    const materials = await Material.find({ course: req.params.course })
      .populate('uploadedBy', 'name email')
      .sort({ uploadedDate: -1 });
    
    res.json(materials);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Upload material
exports.uploadMaterial = async (req, res) => {
  try {
    const { title, course, fileUrl, url, description, category } = req.body;

    const material = new Material({
      title,
      course,
      fileUrl: fileUrl || url || 'https://example.com/demo_material.pdf',
      description: description || '',
      category: category || 'general',
      uploadedBy: req.user.id
    });

    await material.save();
    await material.populate('uploadedBy', 'name email');
    
    // Notify all students in the course
    const courseObj = await Course.findOne({ name: course }) || await Course.findById(course);
    if (courseObj && courseObj.students) {
      const notifications = courseObj.students.map(studentId => ({
        userId: studentId,
        type: 'material',
        title: 'New Material Uploaded',
        description: `A new material "${title}" was uploaded to ${course}.`
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.json(material);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update material (add version)
exports.updateMaterial = async (req, res) => {
  try {
    let material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ msg: 'Material not found' });
    }

    // Add to revisions
    material.revisions.push({
      date: new Date(),
      uploadedBy: req.user.id,
      version: material.version
    });

    material.version += 1;
    material.fileUrl = req.body.fileUrl || req.body.url;
    if (req.body.description) material.description = req.body.description;

    await material.save();

    // Notify all students in the course
    const courseObj = await Course.findOne({ name: material.course }) || await Course.findById(material.course);
    if (courseObj && courseObj.students) {
      const notifications = courseObj.students.map(studentId => ({
        userId: studentId,
        type: 'material',
        title: 'Material Updated',
        description: `Material "${material.title}" was updated to version ${material.version}.`
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.json(material);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Search materials
exports.searchMaterials = async (req, res) => {
  try {
    const { query, course } = req.query;

    const materials = await Material.find({
      $and: [
        { course: course || { $exists: true } },
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .populate('uploadedBy', 'name email')
    .sort({ uploadedDate: -1 });
    
    res.json(materials);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
