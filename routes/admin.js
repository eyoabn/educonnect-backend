const express = require('express');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.get('/users', auth, admin, adminController.getUsers);
router.get('/courses', auth, admin, adminController.getCourses);
router.post('/courses', auth, admin, adminController.createCourse);
router.put('/courses/:id/assign-teacher', auth, admin, adminController.assignTeacher);
router.put('/courses/:id/assign-students', auth, admin, adminController.assignStudents);
router.put('/users/:id/approve', auth, admin, adminController.approveUser);
router.delete('/users/:id', auth, admin, adminController.deleteUser);

router.delete('/announcements/:id', auth, admin, adminController.deleteAnnouncement);
router.delete('/questions/:id', auth, admin, adminController.deleteQuestion);
router.delete('/questions/:questionId/answers/:answerId', auth, admin, adminController.deleteAnswer);

module.exports = router;