const mongoose = require('mongoose');

const saleInvoiceSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    partyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: false
    },
    partyName: { type: String },
    phone: { type: String },

    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, default: Date.now },
    invoiceTime: { type: String }, // e.g. "06:37 PM"
    dueDate: { type: Date },

    // Address Details
    billingAddress: { type: String },
    shippingAddress: { type: String },

    // Transport Details
    eWayBillNo: { type: String },

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
        amount: { type: Number, required: true, default: 0 } // Tax Amount in row? Or Total? Usually total.
    }],

    subTotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    // Payment & Loyalty
    paymentType: { type: String, default: 'Cash' }, // Cash / Credit
    receivedAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },

    loyaltyPointsUsed: { type: Number, default: 0 },
    loyaltyAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 }, // Should match balanceDue


    isOrder: { type: Boolean, default: false }, // Should be false
    isPaid: { type: Boolean, default: true }, // Usually invoices are treated as finalized sales
    status: { type: String, default: 'Unpaid' }, // Paid, Unpaid, Overdue

    // Linkage
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleOrder' }, // If converted from order
    proformaId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProformaInvoice' }, // If converted from proforma
    originalSaleId: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleInvoice' }, // For Returns
    isReturn: { type: Boolean, default: false },

    description: { type: String },
    images: [{ type: String }],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SaleInvoice', saleInvoiceSchema);
