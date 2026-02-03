const SaleOrder = require('../models/SaleOrder');
const SaleInvoice = require('../models/SaleInvoice');
const ProformaInvoice = require('../models/ProformaInvoice');
const Estimate = require('../models/Estimate');
const Item = require('../models/Item');
const Product = require('../models/Product');
const Party = require('../models/Party');
const DeliveryChallan = require('../models/DeliveryChallan');
const CreditNote = require('../models/CreditNote');

const createSale = async (req, res) => {
    const session = await SaleInvoice.startSession(); // Use any model for session
    session.startTransaction();
    try {
        const saleData = req.body;

        if (saleData.documentType === 'SO') {
            // --- CREATE SALE ORDER ---
            delete saleData.documentType; // Clean up

            // Auto-Generate Order Number
            if (!saleData.orderNumber) {
                const lastOrder = await SaleOrder.findOne({ companyId: saleData.companyId }).sort({ createdAt: -1 });
                let nextNum = 1;
                if (lastOrder && lastOrder.orderNumber) {
                    const parts = lastOrder.orderNumber.split('-');
                    const lastNum = parseInt(parts[parts.length - 1]);
                    if (!isNaN(lastNum)) nextNum = lastNum + 1;
                }
                saleData.orderNumber = `ORD-${nextNum}`;
            }

            const saleOrder = new SaleOrder(saleData);
            await saleOrder.save({ session });

            // If converted from Proforma, update Proforma Status
            if (saleData.convertedFromProformaId) {
                const proforma = await ProformaInvoice.findById(saleData.convertedFromProformaId).session(session);
                if (proforma) {
                    proforma.status = 'CONVERTED';
                    proforma.convertedToOrderId = saleOrder._id;
                    await proforma.save({ session });
                }
            }

            await session.commitTransaction();
            session.endSession();
            return res.status(201).json(saleOrder);


        } else if (saleData.documentType === 'PROFORMA') {
            // --- CREATE PROFORMA INVOICE ---
            delete saleData.documentType;

            if (!saleData.refNo) {
                const last = await ProformaInvoice.findOne({ companyId: saleData.companyId }).sort({ createdAt: -1 });
                let nextNum = 1;
                if (last && last.refNo) {
                    const parts = last.refNo.split('-');
                    const lastNum = parseInt(parts[parts.length - 1]);
                    if (!isNaN(lastNum)) nextNum = lastNum + 1;
                }
                saleData.refNo = `PRO-${nextNum}`;
            }

            const proforma = new ProformaInvoice(saleData);
            await proforma.save({ session });
            await session.commitTransaction();
            session.endSession();
            return res.status(201).json(proforma);

        } else if (saleData.documentType === 'ESTIMATE') {
            // --- CREATE ESTIMATE ---
            delete saleData.documentType;

            if (!saleData.refNo) {
                const last = await Estimate.findOne({ companyId: saleData.companyId }).sort({ createdAt: -1 });
                let nextNum = 1;
                if (last && last.refNo) {
                    const parts = last.refNo.split('-');
                    const lastNum = parseInt(parts[parts.length - 1]);
                    if (!isNaN(lastNum)) nextNum = lastNum + 1;
                }
                saleData.refNo = `EST-${nextNum}`;
            }

            const estimate = new Estimate(saleData);
            await estimate.save({ session });
            await session.commitTransaction();
            session.endSession();
            return res.status(201).json(estimate);

        } else if (saleData.documentType === 'DELIVERY_CHALLAN') {
            // --- CREATE DELIVERY CHALLAN ---
            delete saleData.documentType;

            if (!saleData.challanNumber) {
                const last = await DeliveryChallan.findOne({ companyId: saleData.companyId }).sort({ createdAt: -1 });
                let nextNum = 1;
                if (last && last.challanNumber) {
                    const parts = last.challanNumber.split('-');
                    const lastNum = parseInt(parts[parts.length - 1]);
                    if (!isNaN(lastNum)) nextNum = lastNum + 1;
                }
                saleData.challanNumber = `DC-${nextNum}`;
            }

            const challan = new DeliveryChallan(saleData);
            await challan.save({ session });

            // Effect: Decrease Stock (Goods have left)
            if (challan.items && challan.items.length > 0) {
                for (const lineItem of challan.items) {
                    if (lineItem.itemId) {
                        const itemDoc = await Item.findById(lineItem.itemId).session(session);
                        if (itemDoc && itemDoc.type === 'product' && itemDoc.product) {
                            const qty = Number(lineItem.quantity);
                            await Product.findByIdAndUpdate(itemDoc.product, { $inc: { 'currentQuantity': -qty } }, { session });
                        }
                    }
                }
            }

            await session.commitTransaction();
            session.endSession();
            return res.status(201).json(challan);

        } else if (saleData.documentType === 'CREDIT_NOTE') {
            // --- CREATE CREDIT NOTE ---
            delete saleData.documentType;

            if (!saleData.returnNo) {
                const last = await CreditNote.findOne({ companyId: saleData.companyId }).sort({ createdAt: -1 });
                let nextNum = 1;
                if (last && last.returnNo) {
                    const parts = last.returnNo.split('-');
                    const lastNum = parseInt(parts[parts.length - 1]);
                    if (!isNaN(lastNum)) nextNum = lastNum + 1;
                }
                saleData.returnNo = `CN-${nextNum}`;
            }

            const creditNote = new CreditNote(saleData);
            await creditNote.save({ session });

            // Effect 1: Increase Stock (Goods returned)
            if (creditNote.items && creditNote.items.length > 0) {
                for (const lineItem of creditNote.items) {
                    if (lineItem.itemId) {
                        const itemDoc = await Item.findById(lineItem.itemId).session(session);
                        if (itemDoc && itemDoc.type === 'product' && itemDoc.product) {
                            const qty = Number(lineItem.quantity);
                            // Increase Link Stock (Sales Return increases inventory)
                            await Product.findByIdAndUpdate(itemDoc.product, { $inc: { 'currentQuantity': qty } }, { session });
                        }
                    }
                }
            }

            // Effect 2: Update Party Balance (Decrease Receivables)
            if (creditNote.partyId) {
                // Credit Note decreases the party's debt to us (or increases our debt to them)
                // Assuming positive balance means they owe us.
                // Credit Note amount reduces this balance.
                const amount = Number(creditNote.grandTotal) || 0;
                await Party.findByIdAndUpdate(creditNote.partyId, { $inc: { currentBalance: -amount } }, { session });
            }

            await session.commitTransaction();
            session.endSession();
            return res.status(201).json(creditNote);

        } else {
            // --- CREATE SALE INVOICE (Default) ---
            // saleData.documentType = 'INVOICE'; // Implicit

            // Auto-Generate Invoice Number
            if (!saleData.invoiceNumber) {
                const lastInvoice = await SaleInvoice.findOne({ companyId: saleData.companyId }).sort({ createdAt: -1 });
                let nextNum = 1;
                if (lastInvoice && lastInvoice.invoiceNumber) {
                    const parts = lastInvoice.invoiceNumber.split('-');
                    const lastNum = parseInt(parts[parts.length - 1]);
                    if (!isNaN(lastNum)) nextNum = lastNum + 1;
                }
                saleData.invoiceNumber = `INV-${nextNum}`;
            }

            const saleInvoice = new SaleInvoice(saleData);
            await saleInvoice.save({ session });

            // If created from Order, update Order Status
            if (saleData.orderId) {
                const order = await SaleOrder.findById(saleData.orderId).session(session);
                if (order) {
                    order.status = 'CONVERTED';
                    order.convertedToInvoiceId = saleInvoice._id;
                    await order.save({ session });
                }
            }
            // If created from Proforma
            if (saleData.convertedFromProformaId) {
                const proforma = await ProformaInvoice.findById(saleData.convertedFromProformaId).session(session);
                if (proforma) {
                    proforma.status = 'CONVERTED';
                    proforma.convertedToInvoiceId = saleInvoice._id;
                    await proforma.save({ session });
                }
            }
            // If created from Estimate
            if (saleData.convertedFromEstimateId) {
                const estimate = await Estimate.findById(saleData.convertedFromEstimateId).session(session);
                if (estimate) {
                    estimate.status = 'CONVERTED';
                    estimate.convertedToInvoiceId = saleInvoice._id;
                    await estimate.save({ session });
                }
            }

            // --- EFFECT LOGIC (Stock & Party) ---
            // 1. Update Stock
            if (saleInvoice.items && saleInvoice.items.length > 0) {
                for (const lineItem of saleInvoice.items) {
                    if (lineItem.itemId) {
                        const itemDoc = await Item.findById(lineItem.itemId).session(session);
                        if (itemDoc && itemDoc.type === 'product' && itemDoc.product) {
                            const qty = Number(lineItem.quantity);
                            // Sale: Decrease Stock
                            const change = -qty;
                            await Product.findByIdAndUpdate(itemDoc.product, { $inc: { 'currentQuantity': change } }, { session });
                        }
                    }
                }
            }

            // 2. Update Party Balance
            if (saleInvoice.partyId) {
                // If Sale (Credit/Cash check? Usually all invoices affect balance logic if strictly accounting, but simplified here:
                // Assuming "Paid" invoices might not affect balance if receivedAmount == grandTotal?
                // For now, let's stick to standard: Invoice increases Receivable. Payment reduces it.
                // If receivedAmount is present, we handle the net effect.

                const amount = saleInvoice.grandTotal; // Total amount to be received
                const received = saleInvoice.receivedAmount || 0;
                const netBalanceChange = amount - received; // Amount still due

                if (netBalanceChange !== 0 && saleInvoice.paymentType !== 'Cash') {
                    // Only add to balance if it's not fully paid Cash? 
                    // Or just add full amount and subtract received? 
                    // Standard practice: Invoice checks Debit Party.
                    // Here we just increase balance by Due Amount.
                    await Party.findByIdAndUpdate(saleInvoice.partyId, { $inc: { currentBalance: netBalanceChange } }, { session });
                } else if (netBalanceChange !== 0) {
                    // Even if Cash, if there is due? (Partially paid)
                    await Party.findByIdAndUpdate(saleInvoice.partyId, { $inc: { currentBalance: netBalanceChange } }, { session });
                }
            }

            await session.commitTransaction();
            session.endSession();
            return res.status(201).json(saleInvoice);
        }

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Sale Create Error:", error);
        res.status(400).json({ error: error.message });
    }
}

const getSales = async (req, res) => {
    try {
        const { companyId, partyId, startDate, endDate, type, isReturn } = req.query;
        const filter = {};
        if (companyId) filter.companyId = companyId;
        if (partyId) filter.partyId = partyId;

        if (type === 'SO') {
            // Query SaleOrder Collection
            // Date Filter on orderDate
            if (startDate && endDate) {
                filter.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }
            const orders = await SaleOrder.find(filter).populate('partyId', 'name phone').sort({ createdAt: -1 });
            res.json(orders);

        } else if (type === 'PROFORMA') {
            // Query ProformaInvoice Collection
            if (startDate && endDate) {
                filter.invoiceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }
            const proformas = await ProformaInvoice.find(filter).populate('partyId', 'name phone').sort({ createdAt: -1 });
            res.json(proformas);

        } else if (type === 'ESTIMATE') {
            // Query Estimate Collection
            if (startDate && endDate) {
                filter.invoiceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }
            const estimates = await Estimate.find(filter).populate('partyId', 'name phone').sort({ createdAt: -1 });
            res.json(estimates);

        } else if (type === 'DELIVERY_CHALLAN') {
            // Query DeliveryChallan
            if (startDate && endDate) {
                filter.challanDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }
            const challans = await DeliveryChallan.find(filter).populate('partyId', 'name phone').sort({ createdAt: -1 });
            res.json(challans);

        } else if (type === 'CREDIT_NOTE') {
            // Query CreditNote
            if (startDate && endDate) {
                filter.creditNoteDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }
            const creditNotes = await CreditNote.find(filter).populate('partyId', 'name phone').sort({ createdAt: -1 });
            res.json(creditNotes);

        } else {
            // Query SaleInvoice Collection (Default)
            if (startDate && endDate) {
                filter.invoiceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
            }
            if (isReturn !== undefined) filter.isReturn = isReturn === 'true';

            const invoices = await SaleInvoice.find(filter).populate('partyId', 'name phone').sort({ createdAt: -1 });
            res.json(invoices);
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSaleById = async (req, res) => {
    try {
        // Try Invoice first, then Order (Or passing type would be better, but ID collision unlikely if OID)
        let doc = await SaleInvoice.findById(req.params.id).populate('partyId');
        if (!doc) {
            doc = await SaleOrder.findById(req.params.id).populate('partyId');
        }
        if (!doc) {
            doc = await ProformaInvoice.findById(req.params.id).populate('partyId');
        }
        if (!doc) {
            doc = await Estimate.findById(req.params.id).populate('partyId');
        }
        if (!doc) {
            doc = await DeliveryChallan.findById(req.params.id).populate('partyId');
        }
        if (!doc) {
            doc = await CreditNote.findById(req.params.id).populate('partyId');
        }

        if (!doc) return res.status(404).json({ message: 'Sale Document not found' });
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Convert Sale Order to Invoice
const convertToInvoice = async (req, res) => {
    const session = await SaleInvoice.startSession();
    session.startTransaction();
    try {
        const id = req.params.id;
        let doc = await SaleOrder.findById(id).session(session);
        let type = 'SO';

        if (!doc) {
            doc = await ProformaInvoice.findById(id).session(session);
            type = 'PROFORMA';
        }

        if (!doc) {
            doc = await Estimate.findById(id).session(session);
            type = 'ESTIMATE';
        }
        if (!doc) {
            doc = await DeliveryChallan.findById(id).session(session);
            type = 'DELIVERY_CHALLAN';
        }

        if (!doc) throw new Error("Sale Document not found");

        // Prepare Invoice Data
        const invoiceData = doc.toObject();
        delete invoiceData._id;
        delete invoiceData.status;

        if (type === 'SO') {
            delete invoiceData.isOrder;
            delete invoiceData.orderNumber;
            invoiceData.orderId = doc._id;
        } else if (type === 'PROFORMA') {
            delete invoiceData.isProforma;
            delete invoiceData.refNo;
            invoiceData.proformaId = doc._id;
        } else if (type === 'ESTIMATE') {
            delete invoiceData.isEstimate;
            delete invoiceData.refNo;
            invoiceData.estimateId = doc._id; // Needs to be added to SaleInvoice schema if strict, or just omit
        } else if (type === 'DELIVERY_CHALLAN') {
            delete invoiceData.isChallan;
            delete invoiceData.challanNumber;
            invoiceData.challanId = doc._id;
        }

        invoiceData.invoiceNumber = req.body.invoiceNumber || `INV-${Date.now()}`;
        invoiceData.invoiceDate = new Date();

        const newInvoice = new SaleInvoice(invoiceData);
        await newInvoice.save({ session });

        // Update Status
        doc.status = 'CONVERTED';
        doc.convertedToInvoiceId = newInvoice._id;
        await doc.save({ session });

        // Update Stock & Party (Copy Logic from createSale or refactor)
        // If from Delivery Challan, Stock was already reduced. Do NOT reduce again.
        if (type !== 'DELIVERY_CHALLAN' && newInvoice.items && newInvoice.items.length > 0) {
            for (const lineItem of newInvoice.items) {
                if (lineItem.itemId) {
                    const itemDoc = await Item.findById(lineItem.itemId).session(session);
                    if (itemDoc && itemDoc.type === 'product' && itemDoc.product) {
                        await Product.findByIdAndUpdate(itemDoc.product, { $inc: { 'currentQuantity': -Number(lineItem.quantity) } }, { session });
                    }
                }
            }
        }
        // Simplified Party update
        if (newInvoice.partyId) {
            const amount = newInvoice.balanceDue; // Logic: Assuming balance carries over
            if (amount > 0) {
                await Party.findByIdAndUpdate(newInvoice.partyId, { $inc: { currentBalance: amount } }, { session });
            }
        }

        await session.commitTransaction();
        session.endSession();
        res.status(200).json(newInvoice);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: error.message });
    }
};

const updateSale = async (req, res) => {
    try {
        // Check type from body or just try update
        // Simplify: try update Invoice, if null try Order
        let updated = await SaleInvoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) {
            updated = await SaleOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
        }
        if (!updated) {
            updated = await ProformaInvoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        }
        if (!updated) {
            updated = await Estimate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        }
        if (!updated) {
            updated = await DeliveryChallan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        }
        if (!updated) {
            updated = await CreditNote.findByIdAndUpdate(req.params.id, req.body, { new: true });
        }
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteSale = async (req, res) => {
    try {
        // Try deleting from Invoice first
        let deleted = await SaleInvoice.findByIdAndDelete(req.params.id);

        if (!deleted) {
            // If not found, try Order
            deleted = await SaleOrder.findByIdAndDelete(req.params.id);
        }
        if (!deleted) {
            // If not found, try Proforma
            deleted = await ProformaInvoice.findByIdAndDelete(req.params.id);
        }
        if (!deleted) {
            // If not found, try Estimate
            deleted = await Estimate.findByIdAndDelete(req.params.id);
        }
        if (!deleted) {
            deleted = await DeliveryChallan.findByIdAndDelete(req.params.id);
        }
        if (!deleted) {
            deleted = await CreditNote.findByIdAndDelete(req.params.id);
        }

        if (!deleted) {
            return res.status(404).json({ message: 'Sale Document not found' });
        }
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const processReturn = async (req, res) => {
    // Return Logic updates for SaleInvoice
    // ... (Keep existing logic but point to SaleInvoice)
    res.status(501).json({ message: "Return logic refactor pending" });
};

module.exports = {
    createSale,
    getSales,
    getSaleById,
    updateSale,
    deleteSale,
    convertToInvoice,
    processReturn
}