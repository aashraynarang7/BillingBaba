const Product = require('../models/Product');
const Item = require('../models/Item');
const mongoose = require('mongoose');

// Get all inventory (Stock summary)
exports.getInventory = async (req, res) => {
    try {
        const { companyId, lowStock } = req.query;

        // Verify companyId format if strictly needed, but mongo handles casting usually.

        const filter = { type: 'product' };
        if (companyId) {
            filter.companyId = companyId;
        }

        // Fetch Itemsse .populate('product') to get the stock details attached to the Product model
        let items = await Item.find(filter)
            .populate('product')
            .lean();

        // Map to a clean inventory structure
        let inventory = items
            .filter(i => i.product) // Ensure product link exists
            .map(item => {
                const prod = item.product;
                const currentQty = prod.currentQuantity || 0;
                const purchasePrice = prod.purchasePrice ? prod.purchasePrice.amount : 0;

                return {
                    itemId: item._id,
                    itemName: item.name,
                    category: prod.category || '',
                    itemCode: prod.itemCode || '',
                    unit: prod.unit || '',
                    currentStock: currentQty,
                    stockValue: currentQty * purchasePrice,
                    minStockToMaintain: prod.minStockToMaintain || 0,
                    location: prod.location || ''
                };
            });

        // Filter for Low Stock if requested
        if (lowStock === 'true') {
            inventory = inventory.filter(i => i.currentStock <= i.minStockToMaintain);
        }

        res.json(inventory);
    } catch (error) {
        console.error("Get Inventory Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Adjust Stock (Manually)
exports.adjustStock = async (req, res) => {
    const { itemId, adjustmentQty, type, remarks } = req.body;
    // type: 'ADD' or 'REDUCE'

    if (!itemId || !adjustmentQty || !type) {
        return res.status(400).json({ message: 'Missing required fields: itemId, adjustmentQty, type' });
    }

    try {
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        if (item.type !== 'product' || !item.product) {
            return res.status(400).json({ message: 'Stock adjustment is only applicable for Products' });
        }

        const qty = Number(adjustmentQty);
        if (isNaN(qty) || qty < 0) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        const adjustment = (type === 'REDUCE') ? -qty : qty;

        // Update the Product's stock
        const updatedProduct = await Product.findByIdAndUpdate(
            item.product,
            { $inc: { 'currentQuantity': adjustment } },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product record not found' });
        }

        // TODO: In a future iteration, we should log this adjustment to a StockHistory/Transaction model.

        res.json({
            message: 'Stock adjusted successfully',
            newItem: item,
            newStock: updatedProduct.currentQuantity
        });

    } catch (error) {
        console.error("Adjust Stock Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get Stock History (Placeholder for future)
exports.getStockHistory = async (req, res) => {
    res.status(501).json({ message: 'Stock history not implemented yet' });
};
