const Company = require('../models/Company');

exports.createCompany = async (req, res) => {
    try {
        const companyData = req.body;
        // If user is authenticated, add them to users array
        if (req.user) {
            companyData.users = [req.user.id];
        } else {
            // Fallback for testing without auth (optional, but good for now)
            // Or strictly require auth.
        }

        const company = new Company(companyData);
        await company.save();

        // Update User model to add this company to their companies list
        if (req.user) {
            const User = require('../models/User'); // Import here to avoid circular dependency if any
            await User.findByIdAndUpdate(req.user.id, {
                $push: { companies: company._id }
            });
        }

        res.status(201).json(company);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getCompanies = async (req, res) => {
    try {
        // Only return companies where the user is a member
        const filter = {};
        if (req.user) {
            filter.users = req.user.id;
        }
        const companies = await Company.find(filter);
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ message: 'Company not found' });
        res.json(company);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCompany = async (req, res) => {
    try {
        const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!company) return res.status(404).json({ message: 'Company not found' });
        res.json(company);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteCompany = async (req, res) => {
    try {
        const company = await Company.findByIdAndDelete(req.params.id);
        if (!company) return res.status(404).json({ message: 'Company not found' });
        res.json({ message: 'Company deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
