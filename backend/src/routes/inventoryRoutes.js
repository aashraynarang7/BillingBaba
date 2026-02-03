const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// GET /api/inventory - Get all inventory with stock details
router.get('/', inventoryController.getInventory);

// POST /api/inventory/adjust - Manually adjust stock
router.post('/adjust', inventoryController.adjustStock);

// GET /api/inventory/history - Get stock history (Placeholder/Future)
router.get('/history', inventoryController.getStockHistory);

module.exports = router;
