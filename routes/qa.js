const express = require('express');
const qaController = require('../controllers/qaController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/course/:courseId', auth, qaController.getQuestions);
router.get('/', auth, qaController.getAllQuestions);
router.post('/', auth, qaController.createQuestion);
router.post('/:id/answers', auth, qaController.postAnswer);

module.exports = router;
