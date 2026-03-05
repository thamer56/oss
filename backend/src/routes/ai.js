const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

router.post('/ai/generate-tasks', aiController.generateTasks);
router.post('/ai/chat', aiController.chat);

module.exports = router;
