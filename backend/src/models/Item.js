const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: false
    },
    type: {
        type: String,
        enum: ['product', 'service'],
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },

    // --- References ---
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Item', itemSchema);
