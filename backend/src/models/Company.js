const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: false
  },
  gstin: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  businessType: { type: String },
  businessCategory: { type: String },
  state: { type: String },
  pincode: { type: String },
  signature: { type: String }, // URL or base64
  logo: { type: String },      // URL or base64
  party: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party'
  }],
  // Owner id if we have auth later
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Company', companySchema);
