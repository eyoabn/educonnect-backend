const express = require('express');
const notificationsController = require('../controllers/notificationsController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, notificationsController.getNotifications);
router.put('/read-all', auth, notificationsController.markAllAsRead);
router.put('/:id/read', auth, notificationsController.markAsRead);
router.delete('/:id', auth, notificationsController.deleteNotification);

module.exports = router;
