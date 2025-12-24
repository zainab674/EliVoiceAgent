import express from 'express';
import Call from '../models/Call.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

/**
 * GET /api/v1/calls
 * Get all calls for the user
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const calls = await Call.find({ user_id: req.user.id })
            .sort({ created_at: -1 })
            .limit(limit);

        const total = await Call.countDocuments({ user_id: req.user.id });

        res.json({
            success: true,
            data: {
                calls,
                total
            }
        });
    } catch (error) {
        console.error('Error fetching calls:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/v1/calls/:id
 * Get a specific call detail
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const call = await Call.findOne({ _id: id, user_id: req.user.id });

        if (!call) {
            return res.status(404).json({ success: false, error: 'Call not found' });
        }

        res.json({
            success: true,
            data: call
        });
    } catch (error) {
        console.error('Error fetching call:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
