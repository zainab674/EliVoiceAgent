import express from 'express';
import Campaign from '../models/Campaign.js';
import CampaignCall from '../models/CampaignCall.js';
import CallQueue from '../models/CallQueue.js';
import { campaignExecutionEngine } from '../lib/campaign-execution-engine.js';
// Add authentication middleware if available, e.g. verifyToken
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

// Middleware
router.use(authenticateToken);

import Assistant from '../models/Assistant.js';

// ...

// GET /api/v1/campaigns
router.get('/', async (req, res) => {
    try {
        // Find assistants that belong to this user
        const assistants = await Assistant.find({ userId: req.user.id }).select('_id');
        const assistantIds = assistants.map(a => a._id);

        const campaigns = await Campaign.find({
            $or: [
                { userId: req.user.id },
                { assistantId: { $in: assistantIds } }
            ]
        })
            .sort({ createdAt: -1 })
            .populate('assistantId', 'name')
            .populate('contactListId', 'name')
            .populate('csvFileId', 'name');

        res.json({ success: true, campaigns });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/v1/campaigns/:id
router.get('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id })
            .populate('assistantId', 'name')
            .populate('contactListId', 'name')
            .populate('csvFileId', 'name');

        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

        // Fetch stats separately if needed, but they are denormalized on campaign model for now
        // Queue status
        const queueStats = {
            queued: await CallQueue.countDocuments({ campaignId: campaign._id, status: 'queued' }),
            completed: await CallQueue.countDocuments({ campaignId: campaign._id, status: 'completed' }),
            failed: await CallQueue.countDocuments({ campaignId: campaign._id, status: 'failed' }),
            processing: await CallQueue.countDocuments({ campaignId: campaign._id, status: 'processing' }),
        };

        res.json({ success: true, campaign: { ...campaign.toObject(), queueStats } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/v1/campaigns
router.post('/', async (req, res) => {
    try {
        const {
            name,
            assistantId,
            contactSource,
            contactListId,
            csvFileId,
            dailyCap,
            startHour,
            endHour,
            callingDays,
            campaignPrompt
        } = req.body;

        const campaign = await Campaign.create({
            userId: req.user.id,
            name,
            assistantId,
            contactSource,
            contactListId: contactSource === 'contact_list' ? contactListId : null,
            csvFileId: contactSource === 'csv_file' ? csvFileId : null,
            dailyCap,
            startHour,
            endHour,
            callingDays,
            campaignPrompt,
            status: 'draft',
            executionStatus: 'idle'
        });

        res.json({ success: true, campaign });
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/v1/campaigns/:id
router.delete('/:id', async (req, res) => {
    try {
        const result = await Campaign.deleteOne({ _id: req.params.id, userId: req.user.id });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'Campaign not found' });

        // Cascade delete (optional but good practice)
        await CampaignCall.deleteMany({ campaignId: req.params.id });
        await CallQueue.deleteMany({ campaignId: req.params.id });

        res.json({ success: true, message: 'Campaign deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/v1/campaigns/:id/start
router.post('/:id/start', async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

        if (campaign.executionStatus === 'running') {
            return res.status(400).json({ success: false, message: 'Already running' });
        }

        await Campaign.updateOne({ _id: campaign._id }, {
            executionStatus: 'running',
            status: 'active',
            nextCallAt: new Date(),
            // Optional: reset daily calls if new day? No, engine handles that logic ideally
        });

        // Trigger engine immediately
        campaignExecutionEngine.start(); // Ensure it's running
        campaignExecutionEngine.executeCampaigns();

        res.json({ success: true, message: 'Campaign started' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/v1/campaigns/:id/pause
router.post('/:id/pause', async (req, res) => {
    try {
        await Campaign.updateOne(
            { _id: req.params.id, userId: req.user.id },
            { executionStatus: 'paused', status: 'paused' }
        );
        res.json({ success: true, message: 'Campaign paused' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/v1/campaigns/:id/resume
router.post('/:id/resume', async (req, res) => {
    try {
        await Campaign.updateOne(
            { _id: req.params.id, userId: req.user.id },
            { executionStatus: 'running', status: 'active', nextCallAt: new Date() }
        );

        campaignExecutionEngine.start();
        campaignExecutionEngine.executeCampaigns();

        res.json({ success: true, message: 'Campaign resumed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/v1/campaigns/:id/calls
router.get('/:id/calls', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const calls = await CampaignCall.find({ campaignId: req.params.id })
            .sort({ createdAt: -1 })
            .skip(Number(offset))
            .limit(Number(limit));

        const total = await CampaignCall.countDocuments({ campaignId: req.params.id });

        res.json({ success: true, calls, total });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
