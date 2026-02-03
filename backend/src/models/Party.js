const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    // GST & Address Tab
    gstin: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    partyGroup: {
        type: String,
        default: 'General'
    },
    gstType: {
        type: String,
        enum: ['Unregistered/Consumer', 'Registered Regular', 'Registered Composition'],
        default: 'Unregistered/Consumer'
    },
    state: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        trim: true
    },
    billingAddress: {
        type: String,
        trim: true
    },
    shippingAddress: {
        type: String,
        trim: true
    },

    openingBalance: {
        type: Number,
        default: 0
    },
    asOfDate: {
        type: Date,
        default: Date.now
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    isCreditLimitEnabled: {
        type: Boolean,
        default: false
    },
    creditLimit: {
        type: Number,
        default: 0
    },

    // Additional Fields (Placeholder for dynamic fields if needed later)
    additionalFields: {
        type: Map,
        of: String
    },

    // System fields
    partyType: {
        type: String,
        enum: ['customer', 'supplier'],
        default: 'customer'
    },
    currentBalance: {
        type: Number, // Calculated from Opening + Transactions
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Party', partySchema);
