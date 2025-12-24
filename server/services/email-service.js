import nodemailer from 'nodemailer';
import EmailLog from '../models/EmailLog.js';
import Assistant from '../models/Assistant.js';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

class EmailService {
    /**
     * Send an email using User's SMTP settings
     * @param {Object} userSettings - containing smtpHost, smtpPort, smtpUser, smtpPass
     * @param {Object} emailOptions - { from, to, subject, text, html, attachments }
     * @param {Object} context - { userId, assistantId } for logging
     */
    async sendEmail(userSettings, emailOptions, context = {}) {
        const { smtpHost, smtpPort, smtpUser, smtpPass } = userSettings;

        if (!smtpHost || !smtpUser || !smtpPass) {
            throw new Error('Missing SMTP credentials');
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort || 587,
            secure: smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        try {
            const info = await transporter.sendMail(emailOptions);
            console.log('Email sent: %s', info.messageId);

            // Attempt to append to Sent folder via IMAP (best effort)
            if (userSettings.imapHost && userSettings.imapUser && userSettings.imapPass) {
                this.appendSentMessage(userSettings, emailOptions).catch(err => {
                    console.error('Failed to append to Sent folder:', err.message);
                });
            }

            // Log success
            if (context.userId) {
                const logEntry = await EmailLog.create({
                    userId: context.userId,
                    assistantId: context.assistantId,
                    campaignId: context.campaignId,
                    from: emailOptions.from,
                    to: emailOptions.to,
                    subject: emailOptions.subject,
                    body: emailOptions.text || 'HTML Content',
                    direction: 'outbound',
                    status: 'sent',
                    messageId: info.messageId,
                    hasAttachments: !!(emailOptions.attachments && emailOptions.attachments.length > 0),
                    threadId: context.threadId || undefined
                });

                if (!logEntry.threadId) {
                    // Self-assign threadId if new
                    logEntry.threadId = logEntry._id.toString();
                    await logEntry.save();
                }
            }

            return info;
        } catch (error) {
            console.error('Error sending email:', error);

            // Log failure
            if (context.userId) {
                const logEntry = await EmailLog.create({
                    userId: context.userId,
                    assistantId: context.assistantId,
                    campaignId: context.campaignId,
                    from: emailOptions.from,
                    to: emailOptions.to,
                    subject: emailOptions.subject,
                    body: emailOptions.text || 'HTML Content',
                    direction: 'outbound',
                    status: 'failed',
                    error: error.message,
                    hasAttachments: !!(emailOptions.attachments && emailOptions.attachments.length > 0),
                    threadId: context.threadId || undefined
                });

                if (!logEntry.threadId) {
                    logEntry.threadId = logEntry._id.toString();
                    await logEntry.save();
                }
            }
            throw error;
        }
    }

    /**
     * Check for new emails using IMAP and reply if they are part of an assistant thread
     * @param {Object} user - User document
     * @param {Object} integration - User's email integration object
     */
    async monitorInbox(user, integration) {
        if (!integration.isActive) return;

        console.log(`[EmailMonitor] Checking inbox for ${integration.email}...`);

        const { imapHost, imapPort, imapUser, imapPass, email } = integration;
        const imap = (await import('imap-simple'));
        const { simpleParser } = (await import('mailparser'));

        // Force accept self-signed certs
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

        const config = {
            imap: {
                user: imapUser || email,
                password: imapPass,
                host: imapHost || 'imap.gmail.com',
                port: imapPort || 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000
            }
        };

        let connection;
        try {
            connection = await imap.connect(config);
            await connection.openBox('INBOX');

            // Fetch UNSEEN messages
            const searchCriteria = ['UNSEEN'];
            const fetchOptions = {
                bodies: ['HEADER', 'TEXT', ''],
                markSeen: true
            };

            const messages = await connection.search(searchCriteria, fetchOptions);

            if (messages.length === 0) {
                // console.log(`[EmailMonitor] No new messages for ${integration.email}`);
                connection.end();
                return;
            }

            console.log(`[EmailMonitor] Found ${messages.length} new messages for ${integration.email}`);

            for (const item of messages) {
                const all = item.parts.find(part => part.which === '');
                const id = item.attributes.uid;
                const idHeader = "Imap-Id: " + id + "\r\n";
                const parsed = await simpleParser(idHeader + all.body);

                // Check if this is a reply to one of our threads
                await this.processIncomingEmail(user, integration, parsed);
            }

            connection.end();

        } catch (error) {
            console.error(`[EmailMonitor] Error checking ${integration.email}:`, error);
            if (connection) connection.end();
        }
    }

    async processIncomingEmail(user, integration, email) {
        try {
            // 1. Identify Thread
            // Check In-Reply-To or References header
            const references = []
                .concat(email.inReplyTo || [])
                .concat(email.references || []);

            if (references.length === 0) {
                return;
            }

            // Find valid parent message in our logs
            const parentLog = await EmailLog.findOne({
                messageId: { $in: references },
                userId: user._id,
                direction: 'outbound' // We are looking for a reply to our outbound email
            });

            if (!parentLog) {
                // console.log(`[EmailMonitor] Email from ${email.from.text} is not a reply to a known assistant thread.`);
                return;
            }

            console.log(`[EmailMonitor] Match found! Reply to thread ${parentLog.threadId} (Assistant: ${parentLog.assistantId})`);

            // 2. Fetch Assistant
            const assistant = await Assistant.findById(parentLog.assistantId);
            if (!assistant) {
                console.error(`[EmailMonitor] Assistant ${parentLog.assistantId} not found.`);
                return;
            }

            // 3. Log the incoming email
            const inboundLog = await EmailLog.create({
                userId: user._id,
                assistantId: assistant._id,
                from: email.from.text,
                to: email.to.text,
                subject: email.subject,
                body: email.text || 'HTML Content',
                direction: 'inbound',
                status: 'received',
                messageId: email.messageId,
                inReplyTo: parentLog.messageId,
                threadId: parentLog.threadId,
                createdAt: new Date()
            });

            // 4. Generate AI Reply
            await this.generateAndSendReply(user, integration, assistant, inboundLog, email);

        } catch (error) {
            console.error('[EmailMonitor] Error processing email:', error);
        }
    }

    async generateAndSendReply(user, integration, assistant, inboundLog, incomingEmail) {
        try {
            console.log(`[EmailMonitor] Generating AI reply for Assistant: ${assistant.name}`);

            // Fetch thread history
            const history = await EmailLog.find({ threadId: inboundLog.threadId })
                .sort({ createdAt: 1 })
                .limit(10); // Last 10 messages for context

            // Construct Prompt
            let prompt = `You are an AI assistant named ${assistant.name}.\n`;
            prompt += `Your instructions: ${assistant.systemPrompt || 'Be helpful and professional.'}\n\n`;
            prompt += `Conversation History:\n`;

            history.forEach(msg => {
                const role = msg.direction === 'outbound' ? 'You (Assistant)' : 'User';
                // Clean up body (simple truncation or cleanup)
                const snippet = msg.body ? msg.body.substring(0, 500) : '[No Content]';
                prompt += `${role}: ${snippet}\n\n`;
            });

            prompt += `User just replied: "${incomingEmail.text || ''}"\n`;
            prompt += `\nPlease write a reply to the user. Keep it concise and professional. Do not include subject line in the body.`;

            // Call OpenAI
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o",
            });

            const replyText = completion.choices[0].message.content.trim();

            // Send Reply
            const recipient = incomingEmail.from && typeof incomingEmail.from === 'object' && incomingEmail.from.text
                ? incomingEmail.from.text
                : incomingEmail.from;

            const emailOptions = {
                from: integration.email,
                to: recipient, // Reply to sender
                subject: incomingEmail.subject.startsWith('Re:') ? incomingEmail.subject : `Re: ${incomingEmail.subject}`,
                text: replyText,
                html: `<div style="font-family: Arial, sans-serif; pre-wrap: break-word;">${replyText.replace(/\n/g, '<br>')}</div>`,
                headers: {
                    'In-Reply-To': incomingEmail.messageId,
                    'References': `${incomingEmail.references ? incomingEmail.references + ' ' : ''}${incomingEmail.messageId}`
                }
            };

            await this.sendEmail(
                {
                    smtpHost: integration.smtpHost,
                    smtpPort: integration.smtpPort,
                    smtpUser: integration.smtpUser,
                    smtpPass: integration.smtpPass
                },
                emailOptions,
                {
                    userId: user._id,
                    assistantId: assistant._id,
                    threadId: inboundLog.threadId
                }
            );

            console.log(`[EmailMonitor] Auto-reply sent to ${incomingEmail.from.text}`);

        } catch (error) {
            console.error('[EmailMonitor] Failed to generate/send reply:', error);
        }
    }

    /**
     * Check for new emails using IMAP
     * @param {Object} userSettings - containing email, smtpPass (used as imap pass), imapHost, imapPort
     * @returns {Promise<Array>} List of new email objects
     */
    async checkEmails(userSettings) {
        const { email, smtpPass, imapHost, imapPort } = userSettings;
        const imap = (await import('imap-simple'));
        const { simpleParser } = (await import('mailparser'));

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

        const config = {
            imap: {
                user: email,
                password: smtpPass,
                host: imapHost || 'imap.gmail.com',
                port: imapPort || 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000
            }
        };

        const collectedEmails = [];

        try {
            const connection = await imap.connect(config);

            // Helper to fetch and parse from a box
            const fetchFromBox = async (boxName, folderType) => {
                try {
                    await connection.openBox(boxName);

                    const lookback = new Date();
                    lookback.setDate(lookback.getDate() - 7);
                    const searchCriteria = [['SINCE', lookback]];
                    const fetchOptions = {
                        bodies: ['HEADER', 'TEXT', ''],
                        markSeen: false // Don't mark sent items as seen/read (or do?) - usually safe to leave as is
                    };
                    // For INBOX we might want to mark seen, for SENT maybe not?
                    // Previous logic marked seen. Let's keep it consistency: existing logic was markSeen: true.
                    if (folderType === 'inbox') fetchOptions.markSeen = true;

                    const messages = await connection.search(searchCriteria, fetchOptions);
                    console.log(`[EmailService] Found ${messages.length} emails in ${boxName} (${folderType})`);

                    for (const item of messages) {
                        const all = item.parts.find(part => part.which === '');
                        const id = item.attributes.uid;
                        const idHeader = "Imap-Id: " + id + "\r\n";
                        const parsed = await simpleParser(idHeader + all.body);

                        collectedEmails.push({
                            folder: folderType, // 'inbox' or 'sent'
                            from: parsed.from?.text,
                            to: parsed.to?.text,
                            subject: parsed.subject,
                            text: parsed.text,
                            html: parsed.html,
                            messageId: parsed.messageId,
                            inReplyTo: parsed.inReplyTo,
                            references: parsed.references,
                            date: parsed.date
                        });
                    }
                } catch (err) {
                    console.error(`[EmailService] Error fetching from ${boxName}:`, err.message);
                }
            };

            // 1. Fetch INBOX
            await fetchFromBox('INBOX', 'inbox');

            // 2. Fetch SENT
            const sentBox = await this._detectSentBox(connection);
            if (sentBox) {
                await fetchFromBox(sentBox, 'sent');
            } else {
                console.warn('[EmailService] Could not detect Sent folder for syncing');
            }

            connection.end();
            return collectedEmails;

        } catch (error) {
            console.error('[EmailService] IMAP Connection Error:', error);
            return [];
        }
    }

    // Helper to detect sent box
    async _detectSentBox(connection) {
        const boxes = await connection.getBoxes();
        const candidates = ['Sent', 'Sent Items', 'SENT', 'Sent Messages', 'INBOX.Sent', 'INBOX.Sent Items'];

        const findSentBox = (boxList, prefix = '') => {
            for (const key of Object.keys(boxList)) {
                const box = boxList[key];
                const fullPath = prefix + key;
                if (box.attribs && box.attribs.some(a => typeof a === 'string' && a.toUpperCase() === '\\SENT')) {
                    return fullPath;
                }
                if (box.children) {
                    const childFound = findSentBox(box.children, fullPath + box.delimiter);
                    if (childFound) return childFound;
                }
            }
            return null;
        };

        let sentBoxName = findSentBox(boxes);
        if (!sentBoxName) {
            const allPaths = [];
            const flatten = (boxList, prefix = '') => {
                for (const key of Object.keys(boxList)) {
                    const delim = boxList[key].delimiter || '.';
                    allPaths.push(prefix + key);
                    if (boxList[key].children) flatten(boxList[key].children, prefix + key + delim);
                }
            };
            flatten(boxes);
            const match = allPaths.find(p => candidates.some(c => p.endsWith(c) || p === c));
            if (match) sentBoxName = match;
        }
        return sentBoxName;
    }
    /**
     * Append a sent message to the Sent folder via IMAP
     */
    async appendSentMessage(userSettings, emailOptions) {
        const imap = (await import('imap-simple'));

        // Use stream transport to generate raw email
        const nodemailer = (await import('nodemailer'));
        const snubTransport = nodemailer.createTransport({
            streamTransport: true,
            newline: 'windows' // IMAP prefers \r\n
        });

        const info = await snubTransport.sendMail(emailOptions);
        const rawMessage = info.message.toString();

        const config = {
            imap: {
                user: userSettings.imapUser || userSettings.email,
                password: userSettings.imapPass,
                host: userSettings.imapHost,
                port: userSettings.imapPort || 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000
            }
        };

        const connection = await imap.connect(config);

        try {
            // Find the "Sent" box
            const boxes = await connection.getBoxes();
            let sentBoxName = null;

            console.log('[EmailService] IMAP Boxes found:', Object.keys(boxes));

            const candidates = ['Sent', 'Sent Items', 'SENT', 'Sent Messages', 'INBOX.Sent', 'INBOX.Sent Items'];

            // Try to find a box with \Sent attribute
            const findSentBox = (boxList, prefix = '') => {
                for (const key of Object.keys(boxList)) {
                    const box = boxList[key];
                    const fullPath = prefix + key;
                    // console.log(`[EmailService] Checking box: ${fullPath} with attribs: ${box.attribs}`);
                    if (box.attribs && box.attribs.some(a => typeof a === 'string' && a.toUpperCase() === '\\SENT')) {
                        return fullPath;
                    }
                    if (box.children) {
                        const childFound = findSentBox(box.children, fullPath + box.delimiter);
                        if (childFound) return childFound;
                    }
                }
                return null;
            };

            const detectedSent = findSentBox(boxes);
            if (detectedSent) {
                console.log(`[EmailService] Detected Sent folder by attribute: ${detectedSent}`);
                sentBoxName = detectedSent;
            } else {
                // Fallback to name matching
                const allPaths = [];
                const flatten = (boxList, prefix = '') => {
                    for (const key of Object.keys(boxList)) {
                        const delim = boxList[key].delimiter || '.';
                        allPaths.push(prefix + key);
                        if (boxList[key].children) flatten(boxList[key].children, prefix + key + delim);
                    }
                };
                flatten(boxes);

                const match = allPaths.find(p => candidates.some(c => p.endsWith(c) || p === c));
                if (match) {
                    console.log(`[EmailService] Detected Sent folder by name: ${match}`);
                    sentBoxName = match;
                }
            }

            if (!sentBoxName) {
                console.warn('[EmailService] Could not find Sent folder. Available boxes:', Object.keys(boxes));
                sentBoxName = 'Sent'; // Blind attempt
            }

            // Append
            console.log(`[EmailService] Appending sent message to: ${sentBoxName}`);
            await connection.append(rawMessage, {
                mailbox: sentBoxName,
                flags: ['\\Seen']
            });
            console.log(`[EmailService] Successfully appended to ${sentBoxName}`);

        } finally {
            connection.end();
        }
    }
}

export default new EmailService();
