const express = require('express');
const router = express.Router();
const paymentOutController = require('../controllers/paymentOutController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, paymentOutController.createPaymentOut);
router.get('/', protect, paymentOutController.getPaymentOut);
router.get('/:id', protect, paymentOutController.getPaymentOutById);

module.exports = router;
