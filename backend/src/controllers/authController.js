const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ user: { id } }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

// @desc    Send OTP (Mock)
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        if (!phoneNumber) {
            return res.status(400).json({ msg: 'Phone number is required' });
        }

        let user = await User.findOne({ phoneNumber });

        // If user doesn't exist, create temporary record or just allow verification to create
        if (!user) {
            user = new User({ phoneNumber });
            await user.save();
        }

        // Generate Mock OTP
        const otp = '123456';
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save();

        console.log(`OTP for ${phoneNumber}: ${otp}`);

        res.json({ msg: 'OTP sent successfully', otp: '123456' }); // Returning OTP for easy testing
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    try {
        let user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid request' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ msg: 'OTP expired' });
        }

        // Clear OTP
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Return Token
        const token = generateToken(user.id);

        res.json({
            token,
            user: {
                id: user._id,
                phoneNumber: user.phoneNumber,
                name: user.name,
                companies: user.companies
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    sendOtp,
    verifyOtp
};
