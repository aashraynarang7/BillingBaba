const User = require('../models/User');

// Create a new User (Registration / Form Submission)
exports.registerUser = async (req, res) => {
    try {
        const { name, email, companyName, phoneNumber, requirements } = req.body;

        // Basic validation
        if (!name || !email || !phoneNumber) {
            return res.status(400).json({ message: 'Name, Email, and Phone Number are required.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email.' });
        }

        const newUser = new User({
            name,
            email,
            companyName,
            phoneNumber,
            requirements
        });

        await newUser.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser
        });

    } catch (error) {
        console.error('Register User Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get all users (Optional, for admin purposes)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
