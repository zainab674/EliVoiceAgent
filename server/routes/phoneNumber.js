import express from 'express';
import PhoneNumber from '../models/PhoneNumber.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

// ... imports

/**
 * Get all phone number mappings
 * GET /api/v1/phone-numbers
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Find numbers owned by user
        const mappings = await PhoneNumber.find({ userId });
        res.json({
            success: true,
            data: mappings.map(m => ({
                id: m._id,
                phoneSid: m.phoneSid,
                number: m.number,
                label: m.label,
                inbound_assistant_id: m.inboundAssistantId, // Maintain compatibility
                webhook_status: m.webhookStatus,
                status: m.status,
                trunk_sid: m.trunkSid,
                user_id: m.userId
            }))
        });
    } catch (error) {
        console.error('Error fetching phone numbers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Assign a phone number to an assistant
 * POST /api/v1/phone-numbers/assign
 */
router.post('/assign', authenticateToken, async (req, res) => {
    try {
        const { phoneNumber, assistantId, label } = req.body;
        const userId = req.user.id;

        if (!phoneNumber || !assistantId) {
            return res.status(400).json({ success: false, message: 'Phone number and assistant ID are required' });
        }

        const updatedPhoneNumber = await PhoneNumber.findOneAndUpdate(
            { number: phoneNumber },
            {
                number: phoneNumber,
                inboundAssistantId: assistantId,
                label: label || `Assistant ${assistantId}`,
                userId: userId,
                status: 'active',
                webhookStatus: 'configured',
                updatedAt: Date.now()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({
            success: true,
            data: updatedPhoneNumber,
            message: 'Phone number assigned successfully'
        });

    } catch (error) {
        console.error('Error assigning phone number:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
