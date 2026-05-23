const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.get('/course/:courseId', scheduleController.getScheduleByCourse);
router.post('/', scheduleController.createScheduleItem);
router.delete('/:id', scheduleController.deleteScheduleItem);

module.exports = router;
