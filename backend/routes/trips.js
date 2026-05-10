const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const tripController = require('../controllers/tripController');

router.use(authMiddleware); // All trip routes require auth

router.get('/', tripController.getUserTrips);
router.post('/', tripController.createTrip);
router.get('/:id', tripController.getTripById);
router.put('/:id', tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);
router.get('/analytics/dashboard', tripController.getAnalytics);

module.exports = router;