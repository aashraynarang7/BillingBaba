const Party = require('../models/Party');

exports.createParty = async (req, res) => {
    try {
        const party = new Party(req.body);
        await party.save();
        res.status(201).json(party);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getParties = async (req, res) => {
    try {
        const { companyId, search } = req.query;
        const filter = {};
        if (companyId) filter.companyId = companyId;

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const parties = await Party.find(filter).sort({ name: 1 });
        // const parties = await Party.find()
        // console.log(parties)
        res.json(parties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPartyById = async (req, res) => {
    try {
        const party = await Party.findById(req.params.id);
        if (!party) return res.status(404).json({ message: 'Party not found' });
        res.json(party);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateParty = async (req, res) => {
    try {
        const party = await Party.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!party) return res.status(404).json({ message: 'Party not found' });
        res.json(party);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteParty = async (req, res) => {
    try {
        const party = await Party.findByIdAndDelete(req.params.id);
        if (!party) return res.status(404).json({ message: 'Party not found' });
        res.json({ message: 'Party deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
