const express = require('express');
const router = express.Router();
const { createSale, getSales, getSaleById, updateSale, deleteSale, convertToInvoice, processReturn } = require('../controllers/saleController');

const protect = require('../middleware/authMiddleware');

router.post('/', protect, createSale);
router.get('/', protect, getSales);
router.get('/:id', getSaleById);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);
router.post('/:id/convert', convertToInvoice);
router.post('/:id/return', processReturn);

module.exports = router;
