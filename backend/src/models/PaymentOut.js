const mongoose = require('mongoose');

const paymentOutSchema = new mongoose.Schema({
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
    receiptNo: { // Voucher No / Payment Ref
        type: String,
        required: true
    },
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
    linkedPurchases: [{
        purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
        amountSettled: { type: Number, required: true }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PaymentOut', paymentOutSchema);
