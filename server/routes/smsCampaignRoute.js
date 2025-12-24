import express from 'express';
import SmsCampaign from '../models/SmsCampaign.js';
import Assistant from '../models/Assistant.js';
import PhoneNumber from '../models/PhoneNumber.js';
import ContactList from '../models/ContactList.js';
import Contact from '../models/Contact.js';
import CsvFile from '../models/CsvFile.js';
import CsvContact from '../models/CsvContact.js';
import twilio from 'twilio';
import SMSMessage from '../models/SMSMessage.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper to calculate total recipients
const getRecipientCount = async (sourceType, sourceId, userId) => {
    try {
        if (sourceType === 'contact_list') {
            return await Contact.countDocuments({ list_id: sourceId, status: 'active', do_not_call: false });
        } else if (sourceType === 'csv_file') {
            return await CsvContact.countDocuments({ csvFileId: sourceId });
        }
    } catch (e) {
        console.error("Error getting recipient count", e);
        return 0;
    }
    return 0;
};

// GET /api/v1/sms-campaigns
router.get('/', protect, async (req, res) => {
    try {
        const campaigns = await SmsCampaign.find({ userId: req.user._id })
            .populate('assistantId', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, campaigns });
    } catch (error) {
        console.error("Error fetching SMS campaigns:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch campaigns' });
    }
});

// POST /api/v1/sms-campaigns
router.post('/', protect, async (req, res) => {
    try {
        const {
            name,
            assistantId,
            contactSource,
            contactListId,
            csvFileId,
            body
        } = req.body;

        if (!name || !assistantId || !contactSource || !body) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // 1. Check if assistant has a phone number
        const phoneNumber = await PhoneNumber.findOne({
            inboundAssistantId: assistantId,
            status: 'active'
        });

        if (!phoneNumber) {
            return res.status(400).json({ success: false, message: 'No phone number configured for this assistant' });
        }

        const recipientCount = await getRecipientCount(contactSource, contactSource === 'contact_list' ? contactListId : csvFileId, req.user._id);

        const campaign = new SmsCampaign({
            userId: req.user._id,
            name,
            assistantId,
            contactSource,
            contactListId: contactSource === 'contact_list' ? contactListId : undefined,
            csvFileId: contactSource === 'csv_file' ? csvFileId : undefined,
            body,
            status: 'draft',
            totalRecipients: recipientCount
        });

        await campaign.save();

        res.status(201).json({ success: true, campaign });

    } catch (error) {
        console.error("Error creating SMS campaign:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/v1/sms-campaigns/:id/start
router.post('/:id/start', protect, async (req, res) => {
    try {
        const campaign = await SmsCampaign.findOne({ _id: req.params.id, userId: req.user._id });
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        if (campaign.status !== 'draft' && campaign.status !== 'paused' && campaign.status !== 'failed') {
            return res.status(400).json({ success: false, message: 'Campaign is already sending or completed' });
        }

        // Check phone number again just in case
        const phoneNumber = await PhoneNumber.findOne({
            inboundAssistantId: campaign.assistantId,
            status: 'active'
        });

        if (!phoneNumber) {
            return res.status(400).json({ success: false, message: 'No phone number configured for this assistant' });
        }

        // Trigger Sending in background
        processCampaign(campaign._id, req.user._id, phoneNumber.number);

        res.json({ success: true, message: 'Campaign started' });

    } catch (error) {
        console.error("Error starting SMS campaign:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Simple Sending Function
async function processCampaign(campaignId, userId, fromNumber) {
    try {
        const campaign = await SmsCampaign.findById(campaignId);
        if (!campaign) return;

        campaign.status = 'sending';
        await campaign.save();

        let recipients = [];

        // Fetch recipients
        if (campaign.contactSource === 'contact_list') {
            const contacts = await Contact.find({
                list_id: campaign.contactListId,
                status: 'active',
                do_not_call: false
            });
            recipients = contacts.map(c => ({ phone: c.phone, name: c.first_name + ' ' + (c.last_name || '') }));
        } else if (campaign.contactSource === 'csv_file') {
            const contacts = await CsvContact.find({ csvFileId: campaign.csvFileId });
            recipients = contacts.map(c => ({ phone: c.phone, name: c.name }));
        }

        // Initialize Twilio
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (!accountSid || !authToken) {
            console.error("Missing Twilio Credentials in Env");
            campaign.status = 'failed';
            await campaign.save();
            return;
        }

        const client = twilio(accountSid, authToken);

        let sentCount = 0;
        let failedCount = 0;

        for (const recipient of recipients) {
            if (!recipient.phone) continue;

            try {
                const message = await client.messages.create({
                    body: campaign.body,
                    from: fromNumber,
                    to: recipient.phone,
                    statusCallback: `${process.env.NGROK_URL || process.env.BACKEND_URL}/api/v1/twilio/sms/status-callback`
                });

                // Log Message
                await SMSMessage.create({
                    messageSid: message.sid,
                    userId,
                    toNumber: recipient.phone,
                    fromNumber: fromNumber,
                    body: campaign.body,
                    direction: 'outbound',
                    status: message.status,
                    assistantId: campaign.assistantId,
                    campaignId: campaign._id
                });

                sentCount++;
            } catch (err) {
                console.error(`Failed to send SMS to ${recipient.phone}`, err);
                failedCount++;
            }

            // Update stats incrementally
            await SmsCampaign.findByIdAndUpdate(campaignId, {
                'stats.sent': sentCount,
                'stats.failed': failedCount
            });
        }

        await SmsCampaign.findByIdAndUpdate(campaignId, {
            status: 'completed',
            'stats.sent': sentCount,
            'stats.failed': failedCount
        });

    } catch (e) {
        console.error("Campaign processing error", e);
        await SmsCampaign.findByIdAndUpdate(campaignId, { status: 'failed' });
    }
}

export default router;
