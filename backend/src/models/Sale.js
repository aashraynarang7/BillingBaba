const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    // Link to the Item Wrapper Model
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: false // Optional, user might enter a one-off item
    },
    // Snapshot of item details (in case Item is deleted or changed later)
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
        rate: { type: Number, default: 0 }, // e.g. 18 (for 18%)
        amount: { type: Number, default: 0 }
    },

    amount: { type: Number, required: true, default: 0 } // Final row amount
});

const saleSchema = new mongoose.Schema({
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
    partyName: { type: String }, // For manual entry if no party is selected
    phone: { type: String },

    // DOCUMENT TYPE: 'SO' (Sale Order) or 'INVOICE' (Sale Invoice)
    documentType: {
        type: String,
        enum: ['SO', 'INVOICE'],
        default: 'INVOICE',
        required: true
    },

    // Flag to distinguish confirmed Invoice vs Order
    isInvoice: {
        type: Boolean,
        default: true
    },
    isOrder: {
        type: Boolean,
    },
    // Return Feature
    isReturn: {
        type: Boolean,
        default: false
    },
    originalSaleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale'
    },

    // Identification
    invoiceNumber: { type: String }, // Used for Invoice
    orderNumber: { type: String }, // Used for SO

    invoiceDate: { type: Date, default: Date.now },
    orderDate: { type: Date, default: Date.now },
    dueDate: { type: Date },

    stateOfSupply: { type: String },

    items: [saleItemSchema],

    // Footer/Total Details
    description: { type: String },
    images: [{ type: String }], // Array of URLs
    documents: [{ type: String }],

    // Calculation Summary
    subTotal: { type: Number, default: 0 }, // Sum of (Qty * Price) before disc/tax logic
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },

    roundOff: {
        type: Number,
        default: 0
    }, // +/- amount

    grandTotal: { type: Number, required: true },

    // Payment Tracking
    paymentType: { type: String, default: 'Cash' },
    receivedAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },

    // Linkages
    // If a SO is converted to an Invoice, link them
    convertedToInvoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale'
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sale', saleSchema);
