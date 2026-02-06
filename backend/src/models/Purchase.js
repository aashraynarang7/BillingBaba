const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: false
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: 'NONE' },

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
});

const purchaseSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },

    // Header Details
    partyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: false
    },
    partyName: { type: String },
    phone: { type: String },

    // DOCUMENT TYPE: 'PO' (Purchase Order) or 'BILL' (Purchase Bill)
    documentType: {
        type: String,
        enum: ['PO', 'BILL'],
        default: 'BILL',
        required: true
    },

    // The 'HasPaid' flag requested to denote Order vs Bill
    // We will include 'isBill' for clarity but also 'hasPaid' if strict adherence is needed.
    isBill: {
        type: Boolean,
        default: true
    },

    // Return Feature (Debit Note)
    isReturn: {
        type: Boolean,
        default: false
    },
    // Link to original Purchase Bill if this is a return
    originalPurchaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Purchase'
    },

    // Identification
    billNumber: { type: String }, // Used for Bill
    orderNumber: { type: String }, // Used for PO

    billDate: { type: Date, default: Date.now }, // Used for Bill
    orderDate: { type: Date, default: Date.now }, // Used for PO
    dueDate: { type: Date }, // PO/Bill Due Date

    stateOfSupply: { type: String },
    godown: { type: String }, //Warehouse

    items: [purchaseItemSchema],

    description: { type: String },
    images: [{ type: String }],
    documents: [{ type: String }],

    // Totals
    subTotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    // Payment / Accounting
    // Only relevant if isBill = true
    paymentType: { type: String, default: 'Credit' },
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },

    // Linkages
    // If a PO is converted to a Bill, link them
    convertedToBillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Purchase'
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Purchase', purchaseSchema);
