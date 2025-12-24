import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import EmailLog from '../models/EmailLog.js';

const router = express.Router();

// @desc    Get all integrations
// @route   GET /api/v1/integrations
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('email_integrations calendar_integrations');
        res.json({
            email: user.email_integrations || [],
            calendar: user.calendar_integrations || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Add/Update Email Integration
// @route   POST /api/v1/integrations/email
// @access  Private
router.post('/email', protect, async (req, res) => {
    try {
        console.log('Received email integration request:', req.body);
        const { provider, smtpHost, smtpPort, smtpUser, smtpPass, imapHost, imapPort, imapUser, imapPass, email } = req.body;

        if (!req.user || !req.user._id) {
            console.error('User not found in request');
            return res.status(401).json({ message: 'User not authorized' });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            console.error('User not found in DB:', req.user._id);
            return res.status(404).json({ message: 'User not found' });
        }

        const newIntegration = {
            provider,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPass,
            imapHost,
            imapPort,
            imapUser,
            imapPass,
            email,
            isActive: true
        };

        console.log('New integration object:', newIntegration);

        // Check if exists and update, or push new
        // For simplicity, we'll assume one active email integration for now or append
        // Let's replace if email matches, else push
        const existingIndex = user.email_integrations.findIndex(i => i.email === email);
        if (existingIndex > -1) {
            user.email_integrations[existingIndex] = { ...user.email_integrations[existingIndex], ...newIntegration };
        } else {
            user.email_integrations.push(newIntegration);
        }

        await user.save();
        console.log('User saved successfully');
        res.json(user.email_integrations);

    } catch (error) {
        console.error('Error in POST /email:', error);
        res.status(500).json({ message: 'Server Error during email setup', error: error.message, stack: error.stack });
    }
});

// @desc    Remove Email Integration
// @route   DELETE /api/v1/integrations/email/:email
// @access  Private
router.delete('/email/:email', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.email_integrations = user.email_integrations.filter(i => i.email !== req.params.email);
            await user.save();
        }
        res.json(user ? user.email_integrations : []);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

export default router;
