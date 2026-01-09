import express from 'express';
import EmailCampaign from '../models/EmailCampaign.js';
import User from '../models/User.js';
import Contact from '../models/Contact.js';
import CsvContact from '../models/CsvContact.js';
import { protect as requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import emailService from '../services/email-service.js';
import Assistant from '../models/Assistant.js';

const router = express.Router();

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

// GET /api/v1/email-campaigns
router.get('/', requireAuth, async (req, res) => {
    try {
        // Find assistants that belong to this user
        const assistants = await Assistant.find({ userId: req.user.id }).select('_id');
        const assistantIds = assistants.map(a => a._id);

        const campaigns = await EmailCampaign.find({
            $or: [
                { userId: req.user.id },
                { assistantId: { $in: assistantIds } }
            ]
        })
            .populate('assistantId', 'name')
            .sort({ createdAt: -1 });

        // Retrieve integration email for display
        const user = await User.findById(req.user.id).select('email_integrations');

        const enhancedCampaigns = campaigns.map(camp => {
            const integration = user.email_integrations.find(i => i._id.toString() === camp.emailIntegrationId?.toString());
            return {
                ...camp.toObject(),
                senderEmail: integration ? integration.email : 'Unknown'
            };
        });

        res.json({ success: true, campaigns: enhancedCampaigns });
    } catch (error) {
        console.error('Error fetching email campaigns:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch campaigns' });
    }
});

// POST /api/v1/email-campaigns
router.post('/', requireAuth, upload.fields([
    { name: 'attachment', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            name,
            assistantId,
            emailIntegrationId, // This acts as 'accountId'
            contactSource,
            contactListId,
            csvFileId,
            subject,
            body,
            link
        } = req.body;

        const attachment = req.files?.attachment?.[0];
        const image = req.files?.image?.[0];

        if (!name || !assistantId || !emailIntegrationId || !contactSource || !subject || !body) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (contactSource === 'contact_list' && !contactListId) {
            return res.status(400).json({ success: false, message: 'Contact List ID required' });
        }
        if (contactSource === 'csv_file' && !csvFileId) {
            return res.status(400).json({ success: false, message: 'CSV File ID required' });
        }

        // 1. Fetch Recipients
        let recipients = [];
        if (contactSource === 'contact_list') {
            const contacts = await Contact.find({ list_id: contactListId, user_id: req.user.id });
            // Filter for valid emails and active status
            recipients = contacts
                .filter(c => c.email && c.status === 'active' && !c.do_not_call)
                .map(c => c.email);
        } else if (contactSource === 'csv_file') {
            const contacts = await CsvContact.find({ csvFileId: csvFileId });
            recipients = contacts
                .filter(c => c.email) // CsvContacts usually don't have 'active' status unless mapped, assuming simple import
                .map(c => c.email);
        }

        // De-duplicate
        recipients = [...new Set(recipients)];

        if (recipients.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid recipients found in selected source' });
        }

        // 2. Create Campaign Record
        const campaign = new EmailCampaign({
            userId: req.user.id,
            name,
            assistantId,
            emailIntegrationId,
            contactSource,
            contactListId: contactListId || undefined,
            csvFileId: csvFileId || undefined,
            subject,
            body,
            link,
            attachmentPath: attachment ? attachment.path : undefined,
            attachmentOriginalName: attachment ? attachment.originalname : undefined,
            imagePath: image ? image.path : undefined,
            imageOriginalName: image ? image.originalname : undefined,
            status: 'draft',
            totalRecipients: recipients.length
        });

        await campaign.save();

        res.json({ success: true, message: 'Campaign draft created', campaignId: campaign._id });

    } catch (error) {
        console.error('[EmailCampaign] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create campaign' });
    }
});

// POST /api/v1/email-campaigns/:id/start
router.post('/:id/start', requireAuth, async (req, res) => {
    try {
        const campaign = await EmailCampaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        if (campaign.status !== 'draft' && campaign.status !== 'paused' && campaign.status !== 'failed') {
            return res.status(400).json({ success: false, message: 'Campaign is already sending or completed' });
        }

        // Fetch recipients again (re-using logic from creation is ideal, but here we can re-fetch based on saved IDs)
        let recipients = [];
        if (campaign.contactSource === 'contact_list') {
            const contacts = await Contact.find({ list_id: campaign.contactListId, user_id: req.user.id });
            recipients = contacts
                .filter(c => c.email && c.status === 'active' && !c.do_not_call)
                .map(c => c.email);
        } else if (campaign.contactSource === 'csv_file') {
            const contacts = await CsvContact.find({ csvFileId: campaign.csvFileId });
            recipients = contacts
                .filter(c => c.email)
                .map(c => c.email);
        }
        recipients = [...new Set(recipients)];

        if (recipients.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid recipients found' });
        }

        // Fetch sender credentials
        const user = await User.findById(req.user.id).select('email_integrations');
        const integration = user.email_integrations.find(i => i._id.toString() === campaign.emailIntegrationId.toString());

        if (!integration || !integration.isActive) {
            campaign.status = 'failed';
            await campaign.save();
            return res.status(400).json({ success: false, message: 'Selected email account is not active' });
        }

        // Update status to sending
        campaign.status = 'sending';
        // Ensure totalRecipients matches current fetch
        campaign.totalRecipients = recipients.length;
        await campaign.save();

        const emailSettings = {
            smtpHost: integration.smtpHost,
            smtpPort: integration.smtpPort,
            smtpUser: integration.smtpUser,
            smtpPass: integration.smtpPass,
            imapHost: integration.imapHost,
            imapPort: integration.imapPort,
            imapUser: integration.imapUser,
            imapPass: integration.imapPass,
            email: integration.email
        };

        // Prepare content with link replacement or appendix
        let textContent = campaign.body;
        let htmlContent = campaign.body.replace(/\n/g, '<br>');

        if (campaign.link) {
            const linkDisplay = campaign.link;
            const linkHtml = `<a href="${campaign.link}" style="color: #4f46e5; text-decoration: underline; font-weight: bold;">${campaign.link}</a>`;

            if (textContent.includes('{{link}}')) {
                textContent = textContent.replace(/\{\{link\}\}/g, linkDisplay);
                htmlContent = htmlContent.replace(/\{\{link\}\}/g, linkHtml);
            } else {
                // Appendix if no placeholder
                textContent += `\n\n${linkDisplay}`;
                htmlContent += `<br><br>${linkHtml}`;
            }
        } else {
            // Clean up placeholders if no link provided
            textContent = textContent.replace(/\{\{link\}\}/g, '');
            htmlContent = htmlContent.replace(/\{\{link\}\}/g, '');
        }

        // Add image to HTML if exists
        if (campaign.imagePath) {
            const imageHtml = `<br><br><img src="cid:campaignimage" style="max-width: 100%; height: auto; border-radius: 8px;" />`;
            // If there's a link, maybe wrap the image in it too? 
            if (campaign.link) {
                htmlContent += `<br><br><a href="${campaign.link}">${imageHtml}</a>`;
            } else {
                htmlContent += imageHtml;
            }
        }

        const emailOptionsBase = {
            from: integration.email,
            subject: campaign.subject,
            text: textContent,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151;">${htmlContent}</div>`,
            attachments: [
                ...(campaign.attachmentPath ? [{
                    filename: campaign.attachmentOriginalName,
                    path: path.resolve(campaign.attachmentPath)
                }] : []),
                ...(campaign.imagePath ? [{
                    filename: campaign.imageOriginalName,
                    path: path.resolve(campaign.imagePath),
                    cid: 'campaignimage'
                }] : [])
            ]
        };

        res.json({ success: true, message: 'Campaign started' });

        // Background Processing
        (async () => {
            let sentCount = 0;
            let failedCount = 0;

            console.log(`[EmailCampaign] Starting campaign ${campaign._id} for ${recipients.length} recipients`);

            for (const recipientEmail of recipients) {
                // Check if campaign was paused
                const currentCampaign = await EmailCampaign.findById(campaign._id);
                if (!currentCampaign || currentCampaign.status === 'paused') {
                    console.log(`[EmailCampaign] Campaign ${campaign._id} was paused or deleted. Stopping loop.`);
                    return;
                }

                try {
                    await emailService.sendEmail(
                        emailSettings,
                        { ...emailOptionsBase, to: recipientEmail },
                        {
                            userId: req.user.id,
                            assistantId: campaign.assistantId,
                            campaignId: campaign._id
                        }
                    );
                    sentCount++;

                    // Periodically update progress in DB
                    if (sentCount % 5 === 0) {
                        currentCampaign.stats.sent = sentCount;
                        currentCampaign.stats.failed = failedCount;
                        await currentCampaign.save();
                    }
                } catch (err) {
                    console.error(`[EmailCampaign] Failed to send to ${recipientEmail}:`, err.message);
                    failedCount++;
                }
            }

            // Update Final stats
            const finalCampaign = await EmailCampaign.findById(campaign._id);
            if (finalCampaign && finalCampaign.status !== 'paused') {
                finalCampaign.stats.sent = sentCount;
                finalCampaign.stats.failed = failedCount;
                finalCampaign.status = 'completed';
                await finalCampaign.save();
                console.log(`[EmailCampaign] Campaign ${campaign._id} finished. Sent: ${sentCount}, Failed: ${failedCount}`);
            }

        })().catch(err => {
            console.error('[EmailCampaign] Background process error:', err);
            EmailCampaign.findByIdAndUpdate(campaign._id, { status: 'failed' }).catch(() => { });
        });

    } catch (error) {
        console.error('[EmailCampaign] Start Error:', error);
        res.status(500).json({ success: false, message: 'Failed to start campaign' });
    }
});

// POST /api/v1/email-campaigns/:id/pause
router.post('/:id/pause', requireAuth, async (req, res) => {
    try {
        const campaign = await EmailCampaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        if (campaign.status !== 'sending') {
            return res.status(400).json({ success: false, message: 'Only sending campaigns can be paused' });
        }

        campaign.status = 'paused';
        await campaign.save();

        res.json({ success: true, message: 'Campaign paused' });
    } catch (error) {
        console.error('[EmailCampaign] Pause Error:', error);
        res.status(500).json({ success: false, message: 'Failed to pause campaign' });
    }
});

export default router;
