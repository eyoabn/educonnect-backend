const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const auth = require('../middleware/auth');

// GET /api/search?q=keyword&filter=all|courses|announcements|files
router.get('/', auth, searchController.search);

module.exports = router;
