const mongoose = require('mongoose');

const estimateSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    partyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: false
    },
    partyName: { type: String },
    phone: { type: String },

    refNo: { type: String, required: true }, // Auto-generated
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    invoiceTime: { type: String },
    stateOfSupply: { type: String },
    godown: { type: String }, // Warehouse/Godown

    items: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        unit: { type: String },
        priceUnit: {
            amount: { type: Number, required: true, default: 0 },
            taxType: { type: String, enum: ['withTax', 'withoutTax'], default: 'withoutTax' }
        },
        discount: {
            percent: { type: Number, default: 0 },
            amount: { type: Number, default: 0 }
        },
        tax: {
            rate: { type: Number, default: 0 },
            amount: { type: Number, default: 0 }
        },
        amount: { type: Number, required: true, default: 0 }
    }],

    subTotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    isEstimate: { type: Boolean, default: true },
    status: { type: String, enum: ['OPEN', 'CONVERTED'], default: 'OPEN' },

    // Conversion Link
    convertedToInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleInvoice' },
    convertedToOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleOrder' },

    description: { type: String },
    images: [{ type: String }],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Estimate', estimateSchema);
