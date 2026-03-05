const express = require('express');
const router = express.Router();
const controller = require('../controllers/index');

// Projects
router.get('/projects', controller.getAllProjects);
router.get('/projects/:id', controller.getProjectById);
router.post('/projects', controller.createProject);
router.put('/projects/:id', controller.updateProject);
router.delete('/projects/:id', controller.deleteProject);

// Users
router.get('/users', controller.getAllUsers);
router.post('/users', controller.createUser);
router.put('/users/:id/password', controller.updateUserPassword);
router.post('/users/check-si', controller.checkSI);

// Analytics / Stats
router.get('/stats', controller.getStats);
router.get('/stats/:division_id', controller.getStatsByDivision);

// Notifications
router.get('/notifications', controller.getNotifications);
router.post('/notifications', controller.createNotification);
router.put('/notifications/mark-all-read', controller.markAllNotificationsRead);
router.put('/notifications/:id/read', controller.markNotificationRead);

module.exports = router;