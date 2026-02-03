const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    sac: { type: String, trim: true },
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
    purchasePrice: {
        amount: { type: Number, default: 0 },
        taxType: { type: String, enum: ['withTax', 'withoutTax'], default: 'withoutTax' }
    },
    taxRate: { type: Number, default: 0 },

    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
