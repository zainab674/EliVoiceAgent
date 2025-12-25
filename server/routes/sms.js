import express from 'express';
import SMSMessage from '../models/SMSMessage.js';
import Assistant from '../models/Assistant.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

/**
 * GET /api/v1/sms
 * Get all SMS messages for the user
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { limit = 50, assistant_id } = req.query;
        const parsedLimit = parseInt(limit);

        // Find assistants that belong to this user
        const assistants = await Assistant.find({
            $or: [
                { userId: req.user._id },
                { assignedUserEmail: req.user.email }
            ]
        }).select('_id');
        const assistantIds = assistants.map(a => a._id.toString());

        const query = {
            $or: [
                { userId: req.user._id },
                { assistantId: { $in: assistantIds } }
            ]
        };

        if (assistant_id) {
            query.assistantId = assistant_id;
            if (!assistantIds.includes(assistant_id) && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Access denied to this assistant' });
            }
            delete query.$or;
        }

        const messages = await SMSMessage.find(query)
            .sort({ createdAt: -1 })
            .limit(parsedLimit);

        const total = await SMSMessage.countDocuments(query);

        res.json({
            success: true,
            data: {
                messages,
                total
            }
        });
    } catch (error) {
        console.error('Error fetching SMS:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
