import User from '../models/User.js';
import EmailLog from '../models/EmailLog.js';
import emailService from '../services/email-service.js';
import Assistant from '../models/Assistant.js';
import EmailCampaign from '../models/EmailCampaign.js';

class EmailWorker {
    constructor() {
        this.isProcessing = false;
        this.interval = 10000; // Check every 10 seconds
    }

    start() {
        console.log('[EmailWorker] Starting email polling service...');
        // Run immediately
        this.processEmails();
        // Then loop
        setInterval(() => this.processEmails(), this.interval);
    }

    async processEmails() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Find all users with email integrations which have SMTP pass
            const users = await User.find({
                'email_integrations.smtpPass': { $exists: true, $ne: '' }
            });

            console.log(`[EmailWorker] Checking inboxes for ${users.length} users`);

            for (const user of users) {
                if (user.email_integrations) {
                    for (const integration of user.email_integrations) {
                        try {
                            if (!integration.smtpUser || !integration.smtpPass) continue;

                            // Check emails for this user
                            const newEmails = await emailService.checkEmails({
                                email: integration.smtpUser,
                                smtpPass: integration.smtpPass,
                                imapHost: integration.imapHost || 'imap.gmail.com',
                                imapPort: integration.imapPort || 993
                            });

                            if (newEmails.length > 0) {
                                await this.saveSyncedEmails(user, integration, newEmails);
                            }
                        } catch (err) {
                            console.error(`[EmailWorker] Error processing user ${user.email} integration:`, err.message);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('[EmailWorker] Global error:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async saveSyncedEmails(user, integration, emails) {
        for (const email of emails) {
            try {
                // Determine direction based on folder
                const direction = email.folder === 'sent' ? 'outbound' : 'inbound';

                // 1. Try to find a thread based on In-Reply-To or References
                let threadId = null;
                let assistantId = null;
                let campaignId = null;

                if (email.inReplyTo || (email.references && email.references.length > 0)) {
                    // Normalize references to array
                    const refs = Array.isArray(email.references) ? email.references : [email.references];

                    const parentLog = await EmailLog.findOne({
                        $or: [
                            { messageId: email.inReplyTo },
                            { messageId: { $in: refs } }
                        ]
                    });
                    if (parentLog) {
                        threadId = parentLog.threadId || parentLog._id.toString();
                        assistantId = parentLog.assistantId; // Inherit assistant context
                        campaignId = parentLog.campaignId;
                    }
                }

                // 2. If no thread found by ID, try subject matching
                if (!threadId && email.subject) {
                    const cleanSubject = email.subject.replace(/^(Re:|Fwd:)\s*/i, '').trim();
                    const relatedLog = await EmailLog.findOne({
                        userId: user._id,
                        subject: { $regex: new RegExp(cleanSubject, 'i') }
                    }).sort({ createdAt: -1 });

                    if (relatedLog) {
                        threadId = relatedLog.threadId || relatedLog._id.toString();
                        if (!assistantId) assistantId = relatedLog.assistantId;
                        if (!campaignId) campaignId = relatedLog.campaignId;
                    }
                }

                // Check if message already exists
                const existing = await EmailLog.findOne({ messageId: email.messageId });
                if (existing) {
                    continue;
                }

                const newLog = await EmailLog.create({
                    userId: user._id,
                    from: email.from,
                    to: email.to,
                    subject: email.subject,
                    body: email.text || email.html || '[No Content]',
                    direction: direction, // 'inbound' or 'outbound'
                    status: direction === 'inbound' ? 'received' : 'sent',
                    messageId: email.messageId,
                    inReplyTo: email.inReplyTo,
                    hasAttachments: false,
                    threadId: threadId,
                    assistantId: assistantId,
                    campaignId: campaignId,
                    createdAt: email.date || new Date()
                });

                if (!newLog.threadId) {
                    newLog.threadId = newLog._id.toString();
                    await newLog.save();
                }

                console.log(`[EmailWorker] Saved ${direction} email: ${newLog._id} (Thread: ${newLog.threadId})`);

                // Update Campaign Stats (Replies)
                if (campaignId && direction === 'inbound') {
                    await EmailCampaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.replies': 1 } });
                    console.log(`[EmailWorker] Incremented reply count for Campaign ${campaignId}`);
                }

                // 3. Trigger AI Reply ONLY for INBOX messages that have an assistant context
                if (direction === 'inbound' && assistantId && emailService.generateAndSendReply) {
                    const assistant = await Assistant.findById(assistantId);
                    if (assistant) {
                        await emailService.generateAndSendReply(user, integration, assistant, newLog, email);
                    }
                }

            } catch (saveError) {
                console.error('[EmailWorker] Failed to save email:', saveError);
            }
        }
    }
}

export const emailWorker = new EmailWorker();
