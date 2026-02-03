const PaymentOut = require('../models/PaymentOut');
const Party = require('../models/Party');
const Purchase = require('../models/Purchase');
const mongoose = require('mongoose');

// Create Payment Out
exports.createPaymentOut = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { companyId, partyId, receiptNo, date, amount, paymentMode, description, images, linkedPurchases } = req.body;

        // 1. Create Payment Record
        const payment = new PaymentOut({
            companyId,
            partyId,
            receiptNo,
            date,
            amount,
            paymentMode,
            description,
            images,
            linkedPurchases: linkedPurchases || []
        });

        await payment.save({ session });

        // 2. Update Party Balance (Decrease Payable)
        // Since Purchase Increases Balance (Payable), Payment Should Decrease it.
        const party = await Party.findById(partyId).session(session);
        if (party) {
            party.currentBalance = (party.currentBalance || 0) - Number(amount);
            await party.save({ session });
        }

        // 3. Update Linked Purchases (if any)
        if (linkedPurchases && linkedPurchases.length > 0) {
            for (const link of linkedPurchases) {
                const { purchaseId, amountSettled } = link;
                const purchase = await Purchase.findById(purchaseId).session(session);
                if (purchase) {
                    purchase.paidAmount = (purchase.paidAmount || 0) + Number(amountSettled);
                    purchase.balanceDue = (purchase.balanceDue || 0) - Number(amountSettled);

                    // Floating point tolerance
                    if (purchase.balanceDue <= 0.01) {
                        purchase.balanceDue = 0;
                        purchase.isPaid = true; // Assuming Purchase model uses this flag or relies on balanceDue
                    } else {
                        purchase.isPaid = false;
                    }

                    await purchase.save({ session });
                }
            }
        }

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(payment);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error creating Payment Out:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get All Payment Out Records
exports.getPaymentOut = async (req, res) => {
    try {
        const { companyId } = req.query;
        let query = {};
        if (companyId) {
            query.companyId = companyId;
        }

        const payments = await PaymentOut.find(query)
            .populate('partyId', 'name phone')
            .sort({ date: -1 });

        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching Payment Out records:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Single Payment Out
exports.getPaymentOutById = async (req, res) => {
    try {
        const payment = await PaymentOut.findById(req.params.id).populate('partyId');
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
