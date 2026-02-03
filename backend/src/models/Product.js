const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    hsn: { type: String, trim: true },
    unit: { type: String, default: 'pcs' },
    category: { type: String, trim: true },
    itemCode: { type: String, trim: true },
    images: [{ type: String }],

    salePrice: {
        amount: { type: Number, default: 0 },
        taxType: { type: String, enum: ['withTax', 'withoutTax'], default: 'withoutTax' }
    },
    discount: {
        value: { type: Number, default: 0 },
        type: { type: String, enum: ['percentage', 'amount'], default: 'percentage' }
    },
    wholesalePrice: {
        amount: { type: Number, default: 0 },
        taxType: { type: String, enum: ['withTax', 'withoutTax'], default: 'withoutTax' },
        minQuantity: { type: Number, default: 0 }
    },
    purchasePrice: {
        amount: { type: Number, default: 0 },
        taxType: { type: String, enum: ['withTax', 'withoutTax'], default: 'withoutTax' }
    },
    taxRate: { type: Number, default: 0 },

    // Stock / Inventory Fields (Flattened)
    openingQuantity: { type: Number, default: 0 },
    atPrice: { type: Number, default: 0 }, // Opening stock price
    minStockToMaintain: { type: Number, default: 0 },
    location: { type: String },
    currentQuantity: { type: Number, default: 0 },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }
})
module.exports = mongoose.model('Product', productSchema);
