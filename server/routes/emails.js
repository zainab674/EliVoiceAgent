
import express from 'express';
import mongoose from 'mongoose';
import EmailLog from '../models/EmailLog.js';
import Assistant from '../models/Assistant.js';
import User from '../models/User.js';
import { protect as requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import emailService from '../services/email-service.js';

const router = express.Router();

// GET /api/v1/emails/threads
// Get all email conversations (grouped by contact)
router.get('/threads', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { search, assistantId } = req.query;
        const normalizedAssistantId = assistantId && assistantId !== 'all' ? assistantId : null;

        // Find assistants that belong to this user
        const assistants = await Assistant.find({
            $or: [
                { userId: req.user._id },
                { assignedUserEmail: req.user.email }
            ]
        }).select('_id');
        const assistantIds = assistants.map(a => a._id);

        // Group by the "other person" in the conversation
        // Include emails where user is the owner OR the assistant is assigned to the user
        let matchStage = {
            $or: [
                { userId: req.user._id },
                { assistantId: { $in: assistantIds } }
            ]
        };

        if (normalizedAssistantId) {
            matchStage = {
                assistantId: new mongoose.Types.ObjectId(normalizedAssistantId)
            };
            // Optional security: ensure the assistantId belongs to the user
            if (!assistantIds.some(id => id.toString() === normalizedAssistantId) && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Access denied to this assistant' });
            }
        }

        const threads = await EmailLog.aggregate([
            { $match: matchStage },
            { $sort: { createdAt: -1 } },
            {
                $addFields: {
                    rawOtherParty: {
                        $cond: {
                            if: { $eq: ["$direction", "inbound"] },
                            then: "$from",
                            else: "$to"
                        }
                    }
                }
            },
            {
                $addFields: {
                    // Extract email using regex if it looks like "Name <email>"
                    // Compatible with Atlas Free Tier (no $function allowed)
                    cleanOtherParty: {
                        $let: {
                            vars: {
                                match: {
                                    $regexFind: {
                                        input: "$rawOtherParty",
                                        regex: "<([^>]+)>"
                                    }
                                }
                            },
                            in: {
                                $toLower: {
                                    $trim: {
                                        input: {
                                            $cond: {
                                                if: { $ne: ["$$match", null] },
                                                then: { $arrayElemAt: ["$$match.captures", 0] },
                                                else: "$rawOtherParty"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$cleanOtherParty", // Group by cleaned email address
                    lastMessage: { $first: "$$ROOT" },
                    messageCount: { $sum: 1 },
                    // Keep the most recent visual name
                    displayName: { $first: "$rawOtherParty" }
                }
            },
            { $sort: { "lastMessage.createdAt": -1 } }
        ]);

        // Transform for frontend
        const formattedThreads = threads.map(t => ({
            id: t._id, // This is now the clean email address
            senderName: t.displayName || t._id, // Show the nice name if available
            senderEmail: t._id,
            subject: t.lastMessage.subject,
            lastMessage: t.lastMessage.body ? t.lastMessage.body.substring(0, 100) : '',
            timestamp: t.lastMessage.createdAt,
            assistantName: 'Assistant',
            messageCount: t.messageCount
        }));

        if (search) {
            const lowerSearch = search.toLowerCase();
            const filtered = formattedThreads.filter(t =>
                (t.senderName && t.senderName.toLowerCase().includes(lowerSearch)) ||
                (t.subject && t.subject.toLowerCase().includes(lowerSearch))
            );
            return res.json({ success: true, threads: filtered });
        }

        res.json({ success: true, threads: formattedThreads });

    } catch (error) {
        console.error('Error fetching email threads:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch emails', error: error.message });
    }
});

// GET /api/v1/emails/:id
// Get full conversation with a contact (or by threadId)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`[EmailAPI] Fetching conversation for identifier: ${id}`);

        let query;

        // Find assistants that belong to this user
        const assistants = await Assistant.find({
            $or: [
                { userId: req.user._id },
                { assignedUserEmail: req.user.email }
            ]
        }).select('_id');
        const assistantIds = assistants.map(a => a._id);

        if (id.includes('@')) {
            // Extract email if format is "Name <email@domain.com>"
            const emailMatch = id.match(/<([^>]+)>/);
            const cleanEmail = emailMatch ? emailMatch[1] : id;

            // Create loose regex to match this email inside "Name <email>" or just "email"
            const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const emailRegex = new RegExp(escapedEmail, 'i');

            console.log(`[EmailAPI] Searching for conversations with [${cleanEmail}]`);

            query = {
                $and: [
                    {
                        $or: [
                            { userId: req.user._id },
                            { assistantId: { $in: assistantIds } }
                        ]
                    },
                    {
                        $or: [
                            { from: { $regex: emailRegex } },
                            { to: { $regex: emailRegex } }
                        ]
                    }
                ]
            };
        } else {
            // It's a threadId
            query = {
                $and: [
                    {
                        $or: [
                            { userId: req.user._id },
                            { assistantId: { $in: assistantIds } }
                        ]
                    },
                    { threadId: id }
                ]
            };
        }

        let messages = await EmailLog.find(query).sort({ createdAt: 1 });

        // Fallback for threadId if empty (same as before)
        if (messages.length === 0 && !id.includes('@')) {
            const singleMessage = await EmailLog.findOne({ userId: req.user._id, _id: id });
            if (singleMessage) messages = [singleMessage];
        }

        const formattedMessages = messages.map(msg => ({
            id: msg._id,
            from: msg.direction === 'outbound' ? 'assistant' : 'user',
            content: msg.body,
            timestamp: msg.createdAt,
            senderEmail: msg.from
        }));

        res.json({ success: true, messages: formattedMessages });

    } catch (error) {
        console.error('Error fetching thread details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch thread' });
    }
});

// Configure multer for attachment handling
const upload = multer({
    storage: multer.diskStorage({
        destination: 'uploads/',
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + '-' + file.originalname);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// POST /api/v1/emails/automation/send
// Send bulk emails via automation
router.post('/automation/send', requireAuth, upload.single('attachment'), async (req, res) => {
    try {
        const { assistantId, accountId, subject, body, recipients } = req.body;
        const attachment = req.file;

        if (!assistantId || !accountId || !subject || !body || !recipients) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        let recipientsList;
        try {
            recipientsList = JSON.parse(recipients);
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Invalid recipients format' });
        }

        if (!Array.isArray(recipientsList) || recipientsList.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid recipients list' });
        }

        // Fetch user active emails to find credentials
        const user = await User.findById(req.user.id).select('email_integrations');
        const integration = user.email_integrations.find(i => i._id.toString() === accountId);

        if (!integration || !integration.isActive) {
            return res.status(400).json({ success: false, message: 'Selected email account is not active' });
        }

        // Prepare email options base
        const emailOptionsBase = {
            from: integration.email,
            subject: subject,
            text: body, // plain text
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>`,
            attachments: attachment ? [{
                filename: attachment.originalname,
                path: attachment.path
            }] : []
        };

        const emailSettings = {
            smtpHost: integration.smtpHost,
            smtpPort: integration.smtpPort,
            smtpUser: integration.smtpUser,
            smtpPass: integration.smtpPass,
            // Include IMAP settings for appending to Sent folder
            imapHost: integration.imapHost,
            imapPort: integration.imapPort,
            imapUser: integration.imapUser,
            imapPass: integration.imapPass,
            email: integration.email
        };

        // Send to all recipients (in background ideally, but here for MVP in loop)
        // Note: For large lists, this should be offloaded to a worker.
        let sentCount = 0;
        let failedCount = 0;

        console.log(`[EmailAutomation] Starting campaign for ${recipientsList.length} recipients. From: ${integration.email}`);

        // Process sequentially to be safe
        for (const recipientEmail of recipientsList) {
            try {
                // Determine if we need to create a thread info? 
                // emailService.sendEmail logs it to EmailLog.
                // We pass userId and assistantId to link it.
                await emailService.sendEmail(
                    emailSettings,
                    { ...emailOptionsBase, to: recipientEmail },
                    { userId: req.user.id, assistantId: assistantId }
                );
                sentCount++;
            } catch (err) {
                console.error(`[EmailAutomation] Failed to send to ${recipientEmail}:`, err.message);
                failedCount++;
            }
        }

        // Cleanup attachment
        if (attachment) {
            fs.unlink(attachment.path, (err) => { if (err) console.error('Failed to cleanup file:', err) });
        }

        res.json({
            success: true,
            message: `Campaign complete. Sent: ${sentCount}, Failed: ${failedCount}`,
            stats: { sent: sentCount, failed: failedCount }
        });

    } catch (error) {
        console.error('[EmailAutomation] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to execute campaign' });
    }
});

// POST /api/v1/emails/sync
// Trigger manual email sync
router.post('/sync', requireAuth, async (req, res) => {
    try {
        console.log('[EmailAPI] Triggering manual sync...');
        const { emailWorker } = await import('../workers/email-worker.js');

        // Run in background but respond immediately
        emailWorker.processEmails().then(() => {
            console.log('[EmailAPI] Manual sync completed');
        }).catch(err => {
            console.error('[EmailAPI] Manual sync failed:', err);
        });

        res.json({ success: true, message: 'Sync started' });
    } catch (error) {
        console.error('Error triggering sync:', error);
        res.status(500).json({ success: false, message: 'Failed to start sync' });
    }
});

export default router;
