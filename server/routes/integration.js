import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import EmailLog from '../models/EmailLog.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer storage for attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/attachments';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'int-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// @desc    Get all integrations
// @route   GET /api/v1/integrations
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('email_integrations calendar_integrations mongodb_configurations');
        res.json({
            email: user.email_integrations || [],
            calendar: user.calendar_integrations || [],
            mongodb: user.mongodb_configurations || []
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

// @desc    Add MongoDB Integration
// @route   POST /api/v1/integrations/mongodb
// @access  Private
// @desc    Add MongoDB Integration
// @route   POST /api/v1/integrations/mongodb
// @access  Private
router.post('/mongodb', protect, async (req, res) => {
    try {
        const { connectionString, collectionName, assistantId } = req.body;
        const user = await User.findById(req.user._id);

        const newConfig = {
            connectionString,
            collectionName,
            assistantId,
            isActive: true,
            lastSync: null
        };

        user.mongodb_configurations.push(newConfig);
        await user.save();
        res.json(user.mongodb_configurations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Trigger MongoDB Sync
// @route   POST /api/v1/integrations/mongodb/sync/:configId
// @access  Private
router.post('/mongodb/sync/:configId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('mongodb_configurations.assistantId');
        const config = user.mongodb_configurations.id(req.params.configId);

        if (!config) {
            return res.status(404).json({ message: 'Configuration not found' });
        }

        const mongodbIntegrationService = (await import('../services/mongodb-integration-service.js')).default;
        await mongodbIntegrationService.syncLeads(user, config);

        res.json({ success: true, message: 'Sync completed' });
    } catch (error) {
        res.status(500).json({ message: 'Sync Failed', error: error.message });
    }
});

// @desc    Delete MongoDB Configuration
// @route   DELETE /api/v1/integrations/mongodb/:configId
// @access  Private
router.delete('/mongodb/:configId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.mongodb_configurations.pull(req.params.configId);
        await user.save();
        res.json(user.mongodb_configurations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get all MongoDB submissions
// @route   GET /api/v1/integrations/mongodb/submissions
// @access  Private
router.get('/mongodb/submissions', protect, async (req, res) => {
    try {
        const Submission = (await import('../models/Submission.js')).default;
        const Appointment = (await import('../models/Appointment.js')).default;
        const EmailLog = (await import('../models/EmailLog.js')).default;

        const submissions = await Submission.find({ userId: req.user._id })
            .populate('assistantId', 'name')
            .populate('contactId', 'first_name email')
            .sort({ syncedAt: -1 });

        // Calculate interaction status for each submission
        const submissionsWithStatus = await Promise.all(submissions.map(async (sub) => {
            const subObj = sub.toObject();
            const email = sub.contactId?.email || (sub.data && sub.data instanceof Map ? sub.data.get('email') : sub.data?.email);

            if (!email) {
                return { ...subObj, interactionStatus: 'No interaction' };
            }

            // 1. Check for bookings
            const hasBooking = await Appointment.exists({ userId: req.user._id, clientEmail: email });
            if (hasBooking) return { ...subObj, interactionStatus: 'Booking done' };

            // 2. Check for inbound emails (proper conversation)
            const hasInbound = await EmailLog.exists({
                userId: req.user._id,
                direction: 'inbound',
                $or: [{ from: email }, { to: email }] // More robust check
            });
            if (hasInbound) return { ...subObj, interactionStatus: 'Proper conversation' };

            // 3. Check for outbound emails (sent)
            const hasOutbound = await EmailLog.exists({
                userId: req.user._id,
                direction: 'outbound',
                to: email
            });
            if (hasOutbound) return { ...subObj, interactionStatus: 'Email sent' };

            return { ...subObj, interactionStatus: 'No interaction' };
        }));

        res.json(submissionsWithStatus);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

export default router;
