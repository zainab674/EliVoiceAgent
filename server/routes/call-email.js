import express from 'express';
import { protect } from '../middleware/auth.js';
import Call from '../models/Call.js';
import Assistant from '../models/Assistant.js';
import User from '../models/User.js';
import emailService from '../services/email-service.js';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

/**
 * @desc    Send post-call email with documents
 * @route   POST /api/v1/calls/:callId/send-email
 * @access  Private (called by LiveKit agent)
 */
router.post('/:callId/send-email', async (req, res) => {
    try {
        const { callId } = req.params;

        console.log(`[POST-CALL-EMAIL] Processing email for call: ${callId}`);

        // Fetch call record
        // Fetch call record (support both call_sid and call_id)
        const call = await Call.findOne({
            $or: [
                { call_sid: callId },
                { call_id: callId }
            ]
        }).sort({ created_at: -1 });

        if (!call) {
            console.error(`[POST-CALL-EMAIL] Call not found: ${callId}`);
            return res.status(404).json({
                success: false,
                message: 'Call not found'
            });
        }

        // Check if client email was collected
        console.log(`[POST-CALL-EMAIL] Found call:`, {
            id: call._id,
            client_email: call.client_email,
            created_at: call.created_at,
            structured_email: call.structured_data?.email || call.structured_data?.Email
        });

        const clientEmail = call.client_email || call.structured_data?.email || call.structured_data?.Email;

        if (!clientEmail) {
            console.log(`[POST-CALL-EMAIL] No email collected for call: ${callId}`);
            return res.status(200).json({
                success: false,
                message: 'No email collected during call',
                skipped: true
            });
        }

        // Fetch assistant configuration
        const assistant = await Assistant.findById(call.assistant_id);

        if (!assistant) {
            console.error(`[POST-CALL-EMAIL] Assistant not found: ${call.assistant_id}`);
            return res.status(404).json({
                success: false,
                message: 'Assistant not found'
            });
        }

        // Check if email template is configured
        const emailTemplate = assistant.email_templates?.post_call;

        console.log(`[POST-CALL-EMAIL] Assistant email_templates:`, JSON.stringify(assistant.email_templates, null, 2));

        if (!emailTemplate || !emailTemplate.subject || !emailTemplate.body) {
            console.log(`[POST-CALL-EMAIL] No email template configured for assistant: ${assistant._id}`);
            return res.status(200).json({
                success: false,
                message: 'No email template configured',
                skipped: true
            });
        }

        // Get linked email credentials
        const linkedEmailId = assistant.dataCollectionSettings?.linkedEmailId;

        if (!linkedEmailId) {
            console.error(`[POST-CALL-EMAIL] No email credentials linked for assistant: ${assistant._id}`);
            return res.status(400).json({
                success: false,
                message: 'No email credentials linked to assistant'
            });
        }

        // Fetch user and their email credentials
        const user = await User.findById(assistant.userId);

        if (!user) {
            console.error(`[POST-CALL-EMAIL] User not found: ${assistant.userId}`);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find the specific email integration
        const emailIntegration = user.email_integrations.find(
            integration => integration._id.toString() === linkedEmailId
        );

        if (!emailIntegration || !emailIntegration.isActive) {
            console.error(`[POST-CALL-EMAIL] Email integration not found or inactive: ${linkedEmailId}`);
            return res.status(400).json({
                success: false,
                message: 'Email credentials not found or inactive'
            });
        }

        // Prepare email content with variable replacement
        const clientName = call.structured_data?.name || call.structured_data?.Name || call.first_name || 'there';
        const assistantName = assistant.name || 'Your Assistant';

        let subject = emailTemplate.subject
            .replace(/\{clientName\}/g, clientName)
            .replace(/\{assistantName\}/g, assistantName);

        let body = emailTemplate.body
            .replace(/\{clientName\}/g, clientName)
            .replace(/\{assistantName\}/g, assistantName);

        // Prepare attachments from assigned documents
        const attachments = [];

        if (assistant.assigned_documents && assistant.assigned_documents.length > 0) {
            console.log(`[POST-CALL-EMAIL] Processing ${assistant.assigned_documents.length} documents`);

            for (const doc of assistant.assigned_documents) {
                try {
                    // Construct absolute path relative to project root
                    // Strip leading slash if present to avoid absolute path interpretation on Windows
                    const relativePath = doc.path.replace(/^[/\\]/, '');
                    const filePath = path.join(process.cwd(), relativePath);

                    // Check if file exists
                    await fs.access(filePath);

                    attachments.push({
                        filename: doc.name,
                        path: filePath
                    });

                    console.log(`[POST-CALL-EMAIL] Added attachment: ${doc.name}`);
                } catch (fileError) {
                    console.error(`[POST-CALL-EMAIL] File not found: ${doc.path}`, fileError.message);
                    // Continue with other documents even if one fails
                }
            }
        }

        // Prepare email options
        const emailOptions = {
            from: emailTemplate.sender || emailIntegration.email,
            to: clientEmail,
            subject: subject,
            text: body,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>`,
            attachments: attachments
        };

        // Prepare SMTP settings
        const smtpSettings = {
            smtpHost: emailIntegration.smtpHost,
            smtpPort: emailIntegration.smtpPort,
            smtpUser: emailIntegration.smtpUser,
            smtpPass: emailIntegration.smtpPass
        };

        // Send email
        console.log(`[POST-CALL-EMAIL] Sending email to: ${clientEmail}`);

        const emailInfo = await emailService.sendEmail(
            smtpSettings,
            emailOptions,
            {
                userId: user._id,
                assistantId: assistant._id
            }
        );

        console.log(`[POST-CALL-EMAIL] Email sent successfully: ${emailInfo.messageId}`);

        res.json({
            success: true,
            message: 'Email sent successfully',
            messageId: emailInfo.messageId,
            recipient: clientEmail,
            attachmentCount: attachments.length
        });

    } catch (error) {
        console.error('[POST-CALL-EMAIL] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
});

export default router;
