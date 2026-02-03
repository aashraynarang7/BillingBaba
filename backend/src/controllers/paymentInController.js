const PaymentIn = require('../models/PaymentIn');
const Party = require('../models/Party');

const SaleInvoice = require('../models/SaleInvoice');
const mongoose = require('mongoose');

// Create Payment In
exports.createPaymentIn = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { companyId, partyId, receiptNo, date, amount, paymentMode, description, images, linkedInvoices } = req.body;

        // 1. Create Payment Record
        const payment = new PaymentIn({
            companyId,
            partyId,
            receiptNo,
            date,
            amount,
            paymentMode,
            description,
            images,
            linkedInvoices: linkedInvoices || []
        });

        await payment.save({ session });


        // 2. Update Party Balance (Decrease balance for Payment In)
        const party = await Party.findById(partyId).session(session);
        if (party) {
            party.currentBalance = (party.currentBalance || 0) - Number(amount);
            await party.save({ session });
        }

        // 3. Update Linked Invoices (if any)
        if (linkedInvoices && linkedInvoices.length > 0) {
            for (const link of linkedInvoices) {
                const { invoiceId, amountSettled } = link;
                const sale = await SaleInvoice.findById(invoiceId).session(session);
                if (sale) {
                    sale.receivedAmount = (sale.receivedAmount || 0) + Number(amountSettled);
                    sale.balanceDue = (sale.balanceDue || 0) - Number(amountSettled);
                    if (sale.balanceDue <= 0.01) { // Floating point tolerance
                        sale.balanceDue = 0;
                        sale.isPaid = true;
                    } else {
                        sale.isPaid = false;
                    }

                    // Optional: Ensure balance doesn't go below zero if logic allows
                    // if (sale.balanceDue < 0) sale.balanceDue = 0; 

                    await sale.save({ session });
                }
            }
        }

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(payment);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error creating Payment In:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get All Payment In Records
exports.getPaymentIn = async (req, res) => {
    try {
        const { companyId } = req.query;
        let query = {};
        if (companyId) {
            query.companyId = companyId;
        }

        const payments = await PaymentIn.find(query)
            .populate('partyId', 'name phone')
            .sort({ date: -1 });

        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching Payment In records:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Single Payment In
exports.getPaymentInById = async (req, res) => {
    try {
        const payment = await PaymentIn.findById(req.params.id).populate('partyId');
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
