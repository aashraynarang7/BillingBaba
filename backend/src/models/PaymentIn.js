const mongoose = require('mongoose');

const paymentInSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    partyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    receiptNo: {
        type: String,
        required: true
    },
    godown: { type: String }, //Warehouse
    date: {
        type: Date,
        default: Date.now
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Cheque', 'Online'],
        default: 'Cash'
    },
    description: {
        type: String
    },
    images: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    linkedInvoices: [{
        invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleInvoice' },
        amountSettled: { type: Number, required: true }
    }]
});

module.exports = mongoose.model('PaymentIn', paymentInSchema);
