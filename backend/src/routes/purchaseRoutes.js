const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

router.post('/', purchaseController.createPurchase);
router.get('/', purchaseController.getPurchases);
router.get('/:id', purchaseController.getPurchaseById);
router.put('/:id', purchaseController.updatePurchase);
// New Endpoint: Convert PO to  Bill
router.post('/:id/convert', purchaseController.convertToBill);
router.post('/:id/return', purchaseController.processReturn);
router.delete('/:id', purchaseController.deletePurchase);

module.exports = router;
