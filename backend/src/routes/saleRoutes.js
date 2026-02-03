const express = require('express');
const router = express.Router();
const { createSale, getSales, getSaleById, updateSale, deleteSale, convertToInvoice, processReturn } = require('../controllers/saleController');

router.post('/', createSale);
router.get('/', getSales);
router.get('/:id', getSaleById);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);
router.post('/:id/convert', convertToInvoice);
router.post('/:id/return', processReturn);

module.exports = router;
