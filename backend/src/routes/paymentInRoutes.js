const express = require('express');
const router = express.Router();
const paymentInController = require('../controllers/paymentInController');

router.post('/', paymentInController.createPaymentIn);
router.get('/', paymentInController.getPaymentIn);
router.get('/:id', paymentInController.getPaymentInById);

module.exports = router;
