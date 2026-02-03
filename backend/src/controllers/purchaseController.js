const Purchase = require('../models/Purchase');
const Item = require('../models/Item');
const Product = require('../models/Product');
const Party = require('../models/Party');

const DebitNote = require('../models/DebitNote');

exports.createPurchase = async (req, res) => {
    const session = await Purchase.startSession();
    session.startTransaction();
    try {
        const purchaseData = req.body;

        if (purchaseData.documentType === 'DEBIT_NOTE') {
            // --- CREATE DEBIT NOTE ---
            delete purchaseData.documentType;

            if (!purchaseData.returnNo) {
                const last = await DebitNote.findOne({ companyId: purchaseData.companyId }).sort({ createdAt: -1 });
                let nextNum = 1;
                if (last && last.returnNo) {
                    const parts = last.returnNo.split('-');
                    const lastNum = parseInt(parts[parts.length - 1]);
                    if (!isNaN(lastNum)) nextNum = lastNum + 1;
                }
                purchaseData.returnNo = `DN-${nextNum}`;
            }

            const debitNote = new DebitNote(purchaseData);
            await debitNote.save({ session });

            // Effect 1: Decrease Stock (Goods returned to supplier)
            if (debitNote.items && debitNote.items.length > 0) {
                for (const lineItem of debitNote.items) {
                    if (lineItem.itemId) {
                        const itemDoc = await Item.findById(lineItem.itemId).session(session);
                        if (itemDoc && itemDoc.type === 'product' && itemDoc.product) {
                            const qty = Number(lineItem.quantity);
                            // Debit Note -> Decrease Stock 
                            await Product.findByIdAndUpdate(itemDoc.product, { $inc: { 'currentQuantity': -qty } }, { session });
                        }
                    }
                }
            }

            // Effect 2: Update Party Balance (Decrease Payable)
            if (debitNote.partyId) {
                const amount = Number(debitNote.grandTotal) || 0;
                // Debit Note reduces what we owe to the supplier.
                // Assuming positive balance means we owe them (Payable).
                await Party.findByIdAndUpdate(debitNote.partyId, { $inc: { currentBalance: -amount } }, { session });
            }

            await session.commitTransaction();
            session.endSession();
            return res.status(201).json(debitNote);

        } else {
            // Auto-set isBill based on documentType or use default
            if (purchaseData.documentType === 'PO') {
                purchaseData.isBill = false;
            } else {
                purchaseData.documentType = 'BILL';
                purchaseData.isBill = true;
            }

            const purchase = new Purchase(purchaseData);
            await purchase.save({ session });

            // --- EFFECT LOGIC ---
            // Only affect Inventory and Accounts if it is a BILL (or RETURN)
            if (purchase.isBill) {

                // 1. Update Stock
                if (purchase.items && purchase.items.length > 0) {
                    for (const lineItem of purchase.items) {
                        if (lineItem.itemId) {
                            const itemDoc = await Item.findById(lineItem.itemId).session(session);
                            if (itemDoc && itemDoc.type === 'product' && itemDoc.product) {

                                const qty = Number(lineItem.quantity);
                                // If Purchase Bill: Increase Stock
                                // If Purchase Return: Decrease Stock
                                const change = purchase.isReturn ? -qty : qty;

                                await Product.findByIdAndUpdate(
                                    itemDoc.product,
                                    { $inc: { 'currentQuantity': change } },
                                    { session }
                                );
                            }
                        }
                    }
                }

                // 2. Update Party Balance
                if (purchase.partyId) {
                    const payable = purchase.balanceDue;
                    if (payable !== 0) {
                        // If Purchase Bill: Increase Payable
                        // If Purchase Return: Decrease Payable
                        const balanceChange = purchase.isReturn ? -payable : payable;

                        await Party.findByIdAndUpdate(
                            purchase.partyId,
                            { $inc: { currentBalance: balanceChange } },
                            { session }
                        );
                    }
                }
            }

            await session.commitTransaction();
            session.endSession();

            res.status(201).json(purchase);
        }
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Purchase Create Error:", error);
        res.status(400).json({ error: error.message });
    }
};

exports.getPurchases = async (req, res) => {
    try {
        const { companyId, partyId, startDate, endDate, type } = req.query;
        const filter = {};

        if (companyId) filter.companyId = companyId;
        if (partyId) filter.partyId = partyId;

        if (type === 'DEBIT_NOTE') {
            // Query DebitNote
            if (startDate && endDate) {
                filter.debitNoteDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }
            const debitNotes = await DebitNote.find(filter).populate('partyId', 'name phone').sort({ createdAt: -1 });
            return res.json(debitNotes);
        }

        if (type) filter.documentType = type; // Filter by PO or BILL
        if (req.query.isReturn !== undefined) filter.isReturn = req.query.isReturn === 'true';

        // Handle date filtering broadly (checking both fields just in case)
        if (startDate && endDate) {
            filter.$or = [
                { billDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
                { orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }
            ];
        }

        const purchases = await Purchase.find(filter)
            .populate('partyId', 'name phone')
            .sort({ createdAt: -1 });

        res.json(purchases);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPurchaseById = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate('partyId')
            .populate('items.itemId', 'name type');
        if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
        res.json(purchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updatePurchase = async (req, res) => {
    // Note: This does NOT yet handle reverting/re-applying stock logic for edits.
    // That requires diffing the items or full reversal.
    try {
        const purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(purchase);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deletePurchase = async (req, res) => {
    // Note: Ideally revert stock here.
    try {
        await Purchase.findByIdAndDelete(req.params.id);
        res.json({ message: 'Purchase deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// New Endpoint: Convert PO to Bill
exports.convertToBill = async (req, res) => {
    const session = await Purchase.startSession();
    session.startTransaction();
    try {
        const poId = req.params.id;
        const po = await Purchase.findById(poId).session(session);
        if (!po || po.documentType !== 'PO') {
            throw new Error("Invalid Purchase Order");
        }

        // Create new Bill based on PO
        const billData = po.toObject();
        delete billData._id;
        delete billData.createdAt;
        delete billData.updatedAt;

        billData.documentType = 'BILL';
        billData.isBill = true;
        billData.billNumber = req.body.billNumber || `BILL-${Date.now()}`;
        billData.billDate = new Date();
        billData.orderNumber = po.orderNumber; // Keep reference

        const bill = new Purchase(billData);
        await bill.save({ session });

        // Mark PO as converted
        po.convertedToBillId = bill._id;
        await po.save({ session });

        // Apply Stock/Accounting effects for the new Bill
        // (Reusing logic logic or calling internal helper)
        if (bill.items && bill.items.length > 0) {
            for (const lineItem of bill.items) {
                if (lineItem.itemId) {
                    const itemDoc = await Item.findById(lineItem.itemId).session(session);
                    if (itemDoc && itemDoc.type === 'product' && itemDoc.product) {
                        await Product.findByIdAndUpdate(
                            itemDoc.product,
                            { $inc: { 'currentQuantity': Number(lineItem.quantity) } },
                            { session }
                        );
                    }
                }
            }
        }

        if (bill.partyId) {
            const payable = bill.balanceDue;
            if (payable !== 0) {
                await Party.findByIdAndUpdate(
                    bill.partyId,
                    { $inc: { currentBalance: -payable } },
                    { session }
                );
            }
        }

        await session.commitTransaction();
        session.endSession();
        res.status(201).json(bill);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: error.message });
    }
}
exports.processReturn = async (req, res) => {
    const session = await Purchase.startSession();
    session.startTransaction();
    try {
        const purchaseId = req.params.id;
        const { items: returnItems, ...otherDetails } = req.body;

        const originalPurchase = await Purchase.findById(purchaseId).session(session);
        if (!originalPurchase) {
            throw new Error("Original Purchase not found");
        }

        const returnData = {
            ...originalPurchase.toObject(),
            ...otherDetails
        };

        delete returnData._id;
        delete returnData.createdAt;
        delete returnData.updatedAt;
        delete returnData.convertedToBillId;

        // Force Return Flags
        returnData.isReturn = true;
        returnData.isBill = true; // Returns are accounting documents
        returnData.documentType = 'BILL';
        returnData.originalPurchaseId = originalPurchase._id;

        // Generate Return Number
        if (returnData.billNumber && !returnData.billNumber.startsWith('RET-')) {
            returnData.billNumber = `RET-${originalPurchase.billNumber}`;
        }

        if (returnItems && returnItems.length > 0) {
            returnData.items = returnItems;
        }

        const returnPurchase = new Purchase(returnData);
        await returnPurchase.save({ session });

        // --- EFFECT LOGIC For Return ---
        // 1. Stock: Decrease (Sending items back)
        if (returnPurchase.items && returnPurchase.items.length > 0) {
            for (const lineItem of returnPurchase.items) {
                if (lineItem.itemId) {
                    const itemDoc = await Item.findById(lineItem.itemId).session(session);
                    if (itemDoc && itemDoc.type === 'product' && itemDoc.product) {
                        const qty = Number(lineItem.quantity);
                        // Return -> Decrease Stock
                        await Product.findByIdAndUpdate(
                            itemDoc.product,
                            { $inc: { 'currentQuantity': -qty } },
                            { session }
                        );
                    }
                }
            }
        }

        // 2. Party Balance: Increase Balance (Less negative = We owe less)
        if (returnPurchase.partyId) {
            const amount = returnPurchase.balanceDue;
            if (amount !== 0) {
                await Party.findByIdAndUpdate(
                    returnPurchase.partyId,
                    { $inc: { currentBalance: amount } }, // Add positive amount to reduce debt
                    { session }
                );
            }
        }

        await session.commitTransaction();
        session.endSession();
        res.status(201).json(returnPurchase);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: error.message });
    }
}