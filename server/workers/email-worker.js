import User from '../models/User.js';
import EmailLog from '../models/EmailLog.js';
import emailService from '../services/email-service.js';
import Assistant from '../models/Assistant.js';
import EmailCampaign from '../models/EmailCampaign.js';
import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'email-worker.log');
function log(msg) {
    const time = new Date().toISOString();
    fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
    console.log(`[EmailWorker] ${msg}`);
}

class EmailWorker {
    constructor() {
        this.isProcessing = false;
        this.interval = 10000; // Check every 10 seconds
        log('EmailWorker initialized');
    }

    start() {
        console.log('[EmailWorker] Starting email polling service...');
        // Run immediately
        this.processEmails();
        // Then loop
        setInterval(() => this.processEmails(), this.interval);
    }

    async processEmails(targetUserId = null, forceDeep = false) {
        if (this.isProcessing && !targetUserId) {
            log('Sync already in progress, skipping...');
            return;
        }
        if (!targetUserId) this.isProcessing = true;

        log(`Starting sync cycle (User: ${targetUserId || 'ALL'}, Force: ${forceDeep})`);

        try {
            // Find users with email integrations
            const query = {
                'email_integrations.smtpPass': { $exists: true, $ne: '' }
            };
            if (targetUserId) {
                query._id = targetUserId;
            }

            const users = await User.find(query);

            if (!targetUserId) {
                console.log(`[EmailWorker] Checking inboxes for ${users.length} users`);
            }

            for (const user of users) {
                if (user.email_integrations) {
                    for (const integration of user.email_integrations) {
                        try {
                            if (!integration.smtpUser || !integration.smtpPass) continue;

                            // 1. FAST CHECK: Last 1 hour (Sub-second but reliable)
                            const lookbackFast = new Date();
                            lookbackFast.setHours(lookbackFast.getHours() - 24);

                            const fastEmails = await emailService.checkEmails({
                                email: integration.smtpUser,
                                imapUser: integration.imapUser || integration.smtpUser,
                                smtpPass: integration.smtpPass,
                                imapHost: integration.imapHost || 'imap.gmail.com',
                                imapPort: integration.imapPort || 993,
                                userId: user._id
                            }, [['SINCE', lookbackFast]]);

                            log(`[${user.email}] Fast sync found ${fastEmails.length} emails`);
                            if (fastEmails.length > 0) {
                                await this.saveSyncedEmails(user, integration, fastEmails);
                            }

                            // 2. BACKGROUND SYNC: Sent/Recent messages (Every 5 mins OR if forced)
                            const now = Date.now();
                            const needsDeepSync = forceDeep || !integration.lastDeepSync || now - integration.lastDeepSync > 5 * 60 * 1000;

                            if (needsDeepSync) {
                                console.log(`[EmailWorker] ${forceDeep ? 'Forced' : 'Periodic'} deep sync for ${user.email}...`);
                                const lookback = new Date();
                                // If forced, maybe just look back 1 hour to be super fast
                                if (forceDeep) {
                                    lookback.setHours(lookback.getHours() - 1);
                                } else {
                                    lookback.setDate(lookback.getDate() - 1);
                                }

                                const recentEmails = await emailService.checkEmails({
                                    email: integration.smtpUser,
                                    imapUser: integration.imapUser || integration.smtpUser,
                                    smtpPass: integration.smtpPass,
                                    imapHost: integration.imapHost || 'imap.gmail.com',
                                    imapPort: integration.imapPort || 993,
                                    userId: user._id
                                }, [['SINCE', lookback]]);

                                if (recentEmails.length > 0) {
                                    await this.saveSyncedEmails(user, integration, recentEmails);
                                }
                                integration.lastDeepSync = now;
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

                    console.log(`[EmailWorker] Looking for parent of ${email.messageId} (In-Reply-To: ${email.inReplyTo})`);

                    const parentLog = await EmailLog.findOne({
                        userId: user._id, // Strict user scoping
                        $or: [
                            { from: integration.email || integration.smtpUser },
                            { to: integration.email || integration.smtpUser }
                        ],
                        $or: [
                            { messageId: email.inReplyTo },
                            { messageId: { $in: refs } }
                        ]
                    });
                    if (parentLog) {
                        console.log(`[EmailWorker] Parent log found: ${parentLog._id}`);
                        threadId = parentLog.threadId || parentLog._id.toString();
                        assistantId = parentLog.assistantId; // Inherit assistant context
                        campaignId = parentLog.campaignId;
                    } else {
                        console.log(`[EmailWorker] No parent log found for Reply-To: ${email.inReplyTo}`);
                    }
                }

                // 2. If no thread found by ID, try subject matching
                if (!threadId && email.subject) {
                    const cleanSubject = email.subject.replace(/^(Re:|Fwd:)\s*/i, '').trim();
                    const escapedSubject = cleanSubject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const relatedLog = await EmailLog.findOne({
                        userId: user._id,
                        $or: [
                            { from: integration.email || integration.smtpUser },
                            { to: integration.email || integration.smtpUser }
                        ],
                        subject: { $regex: new RegExp(escapedSubject, 'i') }
                    }).sort({ createdAt: -1 });

                    if (relatedLog) {
                        console.log(`[EmailWorker] Found related log by subject: ${relatedLog._id}`);
                        threadId = relatedLog.threadId || relatedLog._id.toString();
                        if (!assistantId) assistantId = relatedLog.assistantId;
                        if (!campaignId) campaignId = relatedLog.campaignId;
                    }
                }

                // 3. Fallback: Lookup Assistant by Contact/Campaign (for empty databases)
                if (!assistantId) {
                    try {
                        const Contact = (await import('../models/Contact.js')).default;
                        const EmailCampaign = (await import('../models/EmailCampaign.js')).default;
                        const cleanEmail = email.folder === 'sent' ? email.to : email.from;
                        // Extract email address
                        const emailAddrMatch = cleanEmail.match(/<([^>]+)>/) || [null, cleanEmail];
                        const emailAddr = (emailAddrMatch[1] || emailAddrMatch[0])?.trim().toLowerCase();

                        if (emailAddr) {
                            let contact = await Contact.findOne({ user_id: user._id, email: emailAddr });
                            let csvContact = null;

                            if (!contact) {
                                // Try CSV contacts
                                const CsvContact = (await import('../models/CsvContact.js')).default;
                                csvContact = await CsvContact.findOne({ email: emailAddr });
                            }

                            if (contact || csvContact) {
                                // Find any campaign using this contact or its list
                                const query = { userId: user._id };
                                if (contact && contact.list_id) {
                                    query.contactListId = contact.list_id;
                                } else if (csvContact) {
                                    query.csvFileId = csvContact.csvFileId;
                                } else {
                                    // General fallback to latest campaign if we know the user
                                    query.status = { $in: ['completed', 'sending', 'draft'] };
                                }

                                const campaign = await EmailCampaign.findOne(query).sort({ createdAt: -1 });

                                if (campaign) {
                                    assistantId = campaign.assistantId;
                                    campaignId = campaign._id;
                                    console.log(`[EmailWorker] Fallback: Linked to Assistant ${assistantId} via Campaign ${campaign.name}`);
                                }
                            }
                        }
                    } catch (err) {
                        console.error('[EmailWorker] Assistant fallback error:', err.message);
                    }
                }

                // Skip emails without messageId
                if (!email.messageId) {
                    console.log(`[EmailWorker] ⚠️  Skipping email without messageId (from: ${email.from}, subject: ${email.subject})`);
                    continue;
                }

                // Check if message already exists
                const existing = await EmailLog.findOne({
                    userId: user._id,
                    messageId: email.messageId
                });

                if (existing) {
                    // Update assistantId if it was missing but we found it now
                    if (!existing.assistantId && assistantId) {
                        console.log(`[EmailWorker] Updating existing log ${existing._id} with assistantId ${assistantId}`);
                        existing.assistantId = assistantId;
                        existing.threadId = existing.threadId || threadId || existing._id.toString();
                        if (campaignId) existing.campaignId = campaignId;
                        await existing.save();

                        // Trigger reply if it's an inbound message that hasn't been replied to
                        if (direction === 'inbound') {
                            console.log(`[EmailWorker] Triggering delayed AI reply for ${existing.messageId}`);
                            const Assistant = (await import('../models/Assistant.js')).default;
                            const assistant = await Assistant.findById(assistantId);
                            if (assistant) {
                                await emailService.generateAndSendReply(user, integration, assistant, existing, email);
                            }
                        }
                    }
                    continue;
                }

                console.log(`[EmailWorker] 📧 Processing NEW ${direction} email: ${email.subject} (from: ${email.from})`);

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
                    imapUid: email.imapUid,
                    mailbox: email.mailbox,
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
                if (direction === 'inbound' && assistantId) {
                    console.log(`[EmailWorker] Attempting to trigger AI reply for Assistant ${assistantId}`);
                    const assistant = await Assistant.findById(assistantId);
                    if (assistant) {
                        console.log(`[EmailWorker] Assistant found: ${assistant.name}`);
                        console.log(`[EmailWorker] emailReplyPrompt: ${assistant.emailReplyPrompt ? 'SET' : 'NOT SET (will use systemPrompt)'}`);
                        console.log(`[EmailWorker] systemPrompt: ${assistant.systemPrompt ? 'SET' : 'NOT SET'}`);
                        await emailService.generateAndSendReply(user, integration, assistant, newLog, email);
                    } else {
                        console.log(`[EmailWorker] Assistant ${assistantId} not found, skipping reply.`);
                    }
                } else if (direction === 'inbound' && !assistantId) {
                    console.log(`[EmailWorker] Inbound email received but no assistantId found. Email will not be replied to automatically.`);
                    console.log(`[EmailWorker] To enable auto-reply, ensure the email is part of an existing thread with an assistant.`);
                }

            } catch (saveError) {
                console.error('[EmailWorker] Failed to save email:', saveError);
            }
        }
    }
}

export const emailWorker = new EmailWorker();
