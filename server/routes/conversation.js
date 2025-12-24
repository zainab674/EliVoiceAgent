import express from 'express';
import Call from '../models/Call.js';
import SMSMessage from '../models/SMSMessage.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

/**
 * GET /api/v1/conversations
 * Get aggregated conversations (Calls + SMS) for the user
 * Implements "Progressive Loading" strategy on backend
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Aggregate logic can be complex.
        // For now, we will fetch recent calls and recent SMS and group them by phone number.
        // This mimics the logic that was previously on the frontend.

        // 1. Fetch Calls
        const calls = await Call.find({ user_id: userId })
            .sort({ created_at: -1 })
            .limit(200); // Limit needed for performance

        // 2. Fetch SMS
        const smsMessages = await SMSMessage.find({ userId: userId })
            .sort({ dateCreated: -1 })
            .limit(200);

        // 3. Group by phone number
        const conversationsMap = new Map();

        const addToMap = (phoneNumber, item, type) => {
            if (!phoneNumber) return;

            if (!conversationsMap.has(phoneNumber)) {
                conversationsMap.set(phoneNumber, {
                    phoneNumber,
                    calls: [],
                    smsMessages: [],
                    lastActivity: new Date(0),
                    contactName: 'Unknown'
                });
            }

            const conv = conversationsMap.get(phoneNumber);
            if (type === 'call') {
                conv.calls.push(item);
                const date = new Date(item.start_time || item.created_at);
                if (date > conv.lastActivity) conv.lastActivity = date;
                if (item.first_name || item.last_name) {
                    conv.contactName = [item.first_name, item.last_name].filter(Boolean).join(' ');
                }
            } else {
                conv.smsMessages.push(item);
                const date = new Date(item.dateCreated || item.createdAt);
                if (date > conv.lastActivity) conv.lastActivity = date;
            }
        };

        calls.forEach(call => addToMap(call.phone_number, call, 'call'));
        smsMessages.forEach(sms => {
            const phoneNumber = sms.direction === 'inbound' ? sms.fromNumber : sms.toNumber;
            addToMap(phoneNumber, sms, 'sms');
        });

        const conversations = Array.from(conversationsMap.values())
            .map(c => ({
                id: `conv_${c.phoneNumber}`,
                phoneNumber: c.phoneNumber,
                contactName: c.contactName,
                lastActivity: c.lastActivity,
                totalCalls: c.calls.length,
                totalSMS: c.smsMessages.length,
                recentCall: c.calls[0] || null,
                recentSMS: c.smsMessages[0] || null
            }))
            .sort((a, b) => b.lastActivity - a.lastActivity);

        res.json({
            success: true,
            data: {
                conversations,
                total: conversations.length
            }
        });

    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/v1/conversations/:phoneNumber
 * Get conversation details (Calls + SMS) for a specific phone number
 */
router.get('/:phoneNumber', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { phoneNumber } = req.params;

        // Decode phone number if it was encoded
        const decodedPhoneNumber = decodeURIComponent(phoneNumber);

        // 1. Fetch Calls
        const calls = await Call.find({
            user_id: userId,
            phone_number: decodedPhoneNumber
        }).sort({ created_at: -1 });

        // 2. Fetch SMS
        // Check for both inbound (from) and outbound (to)
        const smsMessages = await SMSMessage.find({
            userId: userId,
            $or: [
                { fromNumber: decodedPhoneNumber },
                { toNumber: decodedPhoneNumber }
            ]
        }).sort({ dateCreated: -1 });

        res.json({
            success: true,
            data: {
                phoneNumber: decodedPhoneNumber,
                calls,
                smsMessages
            }
        });

    } catch (error) {
        console.error('Error fetching conversation details:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
