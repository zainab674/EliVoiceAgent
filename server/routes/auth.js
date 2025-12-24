import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Assistant from '../models/Assistant.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallbacksecret123', {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/v1/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
    try {
        const {
            email,
            password,
            name,
            // Onboarding fields
            team_size,
            business_type,
            revenue_range,
            pain_points,
            industry,
            phone,
            countryCode
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            team_size,
            business_type,
            revenue_range,
            pain_points,
            industry,
            contact: {
                phone,
                countryCode
            },
            onboarding_completed: true
        });

        // Check for any assistant assigned to this email
        const assignedAssistant = await Assistant.findOne({ assignedUserEmail: email });
        if (assignedAssistant) {
            assignedAssistant.userId = user._id;
            await assignedAssistant.save();
        }

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Authenticate a user
// @route   POST /api/v1/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});



router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
