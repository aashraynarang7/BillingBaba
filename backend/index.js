require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Routes
app.get('/', (req, res) => {
    res.send('BillingBaba Backend is Running');
});

// Import Routes
const companyRoutes = require('./src/routes/companyRoutes');
const partyRoutes = require('./src/routes/partyRoutes');
const saleRoutes = require('./src/routes/saleRoutes');
const purchaseRoutes = require('./src/routes/purchaseRoutes');

app.use('/api/companies', companyRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/items', require('./src/routes/itemRoutes'));
app.use('/api/inventory', require('./src/routes/inventoryRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/payment-in', require('./src/routes/paymentInRoutes'));
app.use('/api/payment-out', require('./src/routes/paymentOutRoutes'));

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
