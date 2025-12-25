import express from 'express';
import Call from '../models/Call.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

import Assistant from '../models/Assistant.js';

/**
 * GET /api/v1/calls
 * Get all calls for the user
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { limit = 50, assistant_id } = req.query;
        const parsedLimit = parseInt(limit);

        // Find assistants that belong to this user (either owned or assigned by email)
        const assistants = await Assistant.find({
            $or: [
                { userId: req.user.id },
                { assignedUserEmail: req.user.email }
            ]
        }).select('_id');
        const assistantIds = assistants.map(a => a._id.toString());

        const query = {
            $or: [
                { user_id: req.user.id },
                { assistant_id: { $in: assistantIds } }
            ]
        };

        // If specific assistant is requested, override the query
        if (assistant_id) {
            query.assistant_id = assistant_id;
            // Also ensure it belongs to the user
            if (!assistantIds.includes(assistant_id) && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Access denied to this assistant' });
            }
            delete query.$or;
        }

        const calls = await Call.find(query)
            .sort({ created_at: -1 })
            .limit(parsedLimit);

        const total = await Call.countDocuments(query);

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
