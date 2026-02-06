const express = require('express');
const router = express.Router();
const paymentInController = require('../controllers/paymentInController');

const protect = require('../middleware/authMiddleware');

router.post('/', protect, paymentInController.createPaymentIn);
router.get('/', protect, paymentInController.getPaymentIn);
router.get('/:id', paymentInController.getPaymentInById);

module.exports = router;
