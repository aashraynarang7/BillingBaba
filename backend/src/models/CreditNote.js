const mongoose = require('mongoose');

const creditNoteSchema = new mongoose.Schema({
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

    returnNo: { type: String, required: true }, // Credit Note Number
    invoiceNumber: { type: String }, // Original Invoice Number
    invoiceDate: { type: Date }, // Original Invoice Date
    creditNoteDate: { type: Date, default: Date.now },

    // Address Details
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

    // Payment Logic
    paymentType: { type: String, default: 'Cash' }, // Cash / Credit
    // For Credit Note, "Received" might mean "Paid" (refunded) or "Adjusted"
    refundAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },

    description: { type: String },
    images: [{ type: String }],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CreditNote', creditNoteSchema);
