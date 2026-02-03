const Item = require('../models/Item');
const Product = require('../models/Product');
const Service = require('../models/Service');

exports.createItem = async (req, res) => {
    try {
        const { type, name, companyId, ...details } = req.body;

        const itemData = {
            companyId,
            type,
            name
        };

        if (type === 'product') {
            // 1. Create Product
            const productData = { ...details, companyId };
            if (productData.openingQuantity && productData.currentQuantity === undefined) {
                productData.currentQuantity = productData.openingQuantity;
            }
            const product = new Product(productData);
            const savedProduct = await product.save();

            // 2. Link Item to Product
            itemData.product = savedProduct._id;

            // STRICT SEPARATION: We do NOT sync fields to Item anymore.
            // Item is strictly a wrapper/linker.

            const item = new Item(itemData);
            await item.save();

            const fullItem = await Item.findById(item._id).populate('product');
            res.status(201).json(fullItem);

        } else if (type === 'service') {
            // 1. Create Service
            const serviceData = { ...details, companyId };

            // Handle legacy mapping if frontend sends 'hsn' for services
            if (serviceData.hsn && !serviceData.sac) serviceData.sac = serviceData.hsn;

            const service = new Service(serviceData);
            const savedService = await service.save();

            // 2. Link Item to Service
            itemData.service = savedService._id;

            const item = new Item(itemData);
            await item.save();

            const fullItem = await Item.findById(item._id).populate('service');
            res.status(201).json(fullItem);

        } else {
            return res.status(400).json({ error: 'Invalid item type' });
        }

    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};

exports.getItems = async (req, res) => {
    try {
        const { companyId, type, productId } = req.query;
        const filter = {};
        if (companyId) filter.companyId = companyId;
        if (type) filter.type = type;
        if (productId) filter.product = productId;

        // Populate both product and service to get details
        const items = await Item.find(filter)
            .populate('product')
            .populate('service');

        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getItemById = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate('product')
            .populate('service');

        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { name, ...details } = req.body;

        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (name) item.name = name;

        if (item.type === 'product' && item.product) {
            await Product.findByIdAndUpdate(item.product, details);
            await item.save(); // Save name change
        } else if (item.type === 'service' && item.service) { // Check for Linked Service
            if (details.hsn && !details.sac) details.sac = details.hsn;
            await Service.findByIdAndUpdate(item.service, details);
            await item.save();
        } else if (item.type === 'service' && !item.service) {
            // Legacy fallback: If existing service item has no Service doc (from old double-write),
            // Migrating on the fly would be complex. Ideally, we shouldn't hit this if DB is clean.
            // But for now, just save name. Details update might fail if we don't handle it.
            // Assumption: This is new strict mode, old data might need migration script.
            await item.save();
        }

        const updatedItem = await Item.findById(req.params.id)
            .populate('product')
            .populate('service');

        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (item.type === 'product' && item.product) {
            await Product.findByIdAndDelete(item.product);
        } else if (item.type === 'service' && item.service) {
            await Service.findByIdAndDelete(item.service);
        }

        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
