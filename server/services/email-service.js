import nodemailer from 'nodemailer';
import EmailLog from '../models/EmailLog.js';
import Appointment from '../models/Appointment.js';
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

        console.log('[EmailService] Preparing to send email...');
        console.log('[EmailService] SMTP Config:', {
            host: smtpHost,
            port: smtpPort || 587,
            secure: smtpPort === 465,
            user: smtpUser,
            passLength: smtpPass?.length
        });
        console.log('[EmailService] Email Details:', {
            from: emailOptions.from,
            to: emailOptions.to,
            subject: emailOptions.subject,
            hasHeaders: !!emailOptions.headers,
            headers: emailOptions.headers
        });

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort) || 587,
            secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 40000, // 40 seconds
            greetingTimeout: 40000,
            socketTimeout: 60000,
            debug: true, // Enable debug output
            logger: true // Log to console
        });

        try {
            console.log('[EmailService] Sending email now...');
            const info = await transporter.sendMail(emailOptions);
            console.log('---------------------------------------------------');
            console.log('[EmailService] ✅ Email sent successfully!');
            console.log('[EmailService] Message ID: %s', info.messageId);
            console.log('[EmailService] SMTP Response:', info.response);
            console.log('[EmailService] Accepted Recipients:', info.accepted);
            console.log('[EmailService] Rejected Recipients:', info.rejected);
            console.log('[EmailService] Pending Recipients:', info.pending);
            console.log('[EmailService] Envelope:', JSON.stringify(info.envelope, null, 2));

            // Check if email was actually accepted
            if (info.rejected && info.rejected.length > 0) {
                console.error('[EmailService] ⚠️ WARNING: Some recipients were REJECTED:', info.rejected);
            }
            if (!info.accepted || info.accepted.length === 0) {
                console.error('[EmailService] ❌ ERROR: No recipients accepted the email!');
                throw new Error('Email was not accepted by any recipients');
            }

            console.log('---------------------------------------------------');

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
            console.error('---------------------------------------------------');
            console.error('[EmailService] ❌ Error sending email:', error.message);
            console.error('[EmailService] Error code:', error.code);
            console.error('[EmailService] Error command:', error.command);
            console.error('[EmailService] Full error:', error);
            console.error('---------------------------------------------------');

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
                direction: 'outbound', // We are looking for a reply to our outbound email
                from: integration.email || integration.smtpUser
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

            // Validate OpenAI API Key
            if (!process.env.OPENAI_API_KEY) {
                console.error('[EmailMonitor] OPENAI_API_KEY is not set in environment variables. Cannot generate AI reply.');
                return;
            }

            // Validate SMTP credentials
            if (!integration.smtpHost || !integration.smtpUser || !integration.smtpPass) {
                console.error('[EmailMonitor] Missing SMTP credentials in integration. Cannot send reply.');
                console.error(`[EmailMonitor] smtpHost: ${integration.smtpHost ? 'SET' : 'MISSING'}`);
                console.error(`[EmailMonitor] smtpUser: ${integration.smtpUser ? 'SET' : 'MISSING'}`);
                console.error(`[EmailMonitor] smtpPass: ${integration.smtpPass ? 'SET' : 'MISSING'}`);
                return;
            }

            // Fetch thread history
            const history = await EmailLog.find({ threadId: inboundLog.threadId })
                .sort({ createdAt: 1 })
                .limit(10); // Last 10 messages for context

            // Construct Prompt
            let historyText = '';
            const logs = await EmailLog.find({ threadId: inboundLog.threadId }).sort({ createdAt: 1 });

            logs.forEach(msg => {
                const role = msg.direction === 'outbound' ? 'You (Assistant)' : 'User';
                const snippet = msg.body ? msg.body.substring(0, 500) : '[No Content]';
                historyText += `${role}: ${snippet}\n\n`;
            });

            const messageText = incomingEmail.text || '';
            let recipientName = 'User';
            let recipientEmail = '';

            if (incomingEmail.from && typeof incomingEmail.from === 'object') {
                recipientName = incomingEmail.from.name || 'User';
                recipientEmail = incomingEmail.from.text;
            } else if (typeof incomingEmail.from === 'string') {
                const match = incomingEmail.from.match(/(.*)<([^>]+)>/);
                if (match) {
                    recipientName = match[1].trim() || 'User';
                    recipientEmail = match[2].trim();
                } else {
                    recipientEmail = incomingEmail.from.trim();
                }
            }

            const threadInfo = {
                recipientName,
                recipientEmail
            };

            const systemPrompt = assistant.emailReplyPrompt || "You are a professional and helpful email assistant.";

            console.log(`[EmailMonitor] Using prompt: ${systemPrompt.substring(0, 100)}...`);
            console.log(`[EmailMonitor] Thread history length: ${logs.length} messages`);
            console.log(`[EmailMonitor] Incoming message from: ${threadInfo.recipientEmail}`);

            console.log(`[EmailMonitor] Calling OpenAI API...`);
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Conversation history:\n${historyText}\n\nLatest message from ${threadInfo.recipientName || threadInfo.recipientEmail}: "${messageText}"\n\nGenerate a concise and professional reply.` }
                ]
            });

            const responseMessage = completion.choices[0].message;
            let replyText = responseMessage.content || '';

            console.log(`[EmailMonitor] AI generated reply (${replyText.length} chars)`);


            if (!replyText || replyText.trim() === '') {
                console.error('[EmailMonitor] AI generated empty reply. Aborting send.');
                return;
            }

            // Send Reply
            const recipient = incomingEmail.from && typeof incomingEmail.from === 'object' && incomingEmail.from.text
                ? incomingEmail.from.text
                : incomingEmail.from;

            const emailOptions = {
                from: integration.email,
                to: recipient, // Reply to sender
                subject: incomingEmail.subject.replace(/\*\*\*SPAM\*\*\*\s*/gi, '').startsWith('Re:')
                    ? incomingEmail.subject.replace(/\*\*\*SPAM\*\*\*\s*/gi, '')
                    : `Re: ${incomingEmail.subject.replace(/\*\*\*SPAM\*\*\*\s*/gi, '')}`,
                text: replyText,
                html: `<div style="font-family: Arial, sans-serif; pre-wrap: break-word;">${replyText.replace(/\n/g, '<br>')}</div>`,
                headers: {
                    'In-Reply-To': incomingEmail.messageId,
                    'References': `${incomingEmail.references ? incomingEmail.references + ' ' : ''}${incomingEmail.messageId}`
                }
            };

            console.log(`[EmailMonitor] Sending reply to: ${recipient}`);
            console.log(`[EmailMonitor] Subject: ${emailOptions.subject}`);

            await this.sendEmail(
                {
                    smtpHost: integration.smtpHost,
                    smtpPort: integration.smtpPort,
                    smtpUser: integration.smtpUser,
                    smtpPass: integration.smtpPass,
                    imapHost: integration.imapHost,
                    imapUser: integration.imapUser || integration.smtpUser,
                    imapPass: integration.imapPass || integration.smtpPass
                },
                emailOptions,
                {
                    userId: user._id,
                    assistantId: assistant._id,
                    threadId: inboundLog.threadId
                }
            );

            console.log(`[EmailMonitor] Auto-reply sent successfully to ${recipient}`);

        } catch (error) {
            console.error('[EmailMonitor] Failed to generate/send reply:', error);
            console.error('[EmailMonitor] Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
    }

    /**
     * @param {Object} userSettings - containing email, smtpPass (used as imap pass), imapHost, imapPort, userId
     * @returns {Promise<Array>} List of new email objects
     */
    async checkEmails(userSettings, criteria = null) {
        const { email, imapUser, smtpPass, imapHost, imapPort, userId } = userSettings;
        const imap = (await import('imap-simple'));
        const { simpleParser } = (await import('mailparser'));
        const EmailLog = (await import('../models/EmailLog.js')).default;

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

        const config = {
            imap: {
                user: imapUser || email,
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

            connection.on('error', (err) => {
                console.error('[EmailService] IMAP connection emitted error:', err.message);
            });

            // Helper to fetch and parse from a box
            const fetchFromBox = async (boxName, folderType) => {
                try {
                    await connection.openBox(boxName);

                    let searchCriteria = criteria;
                    if (!searchCriteria) {
                        const lookback = new Date();
                        lookback.setDate(lookback.getDate() - 3); // Default to 3 days for efficiency
                        searchCriteria = [['SINCE', lookback]];
                    }

                    // 1. FAST STAGE: Fetch only headers/attributes to check for existence
                    const headerFetchOptions = {
                        bodies: ['HEADER.FIELDS (MESSAGE-ID)'],
                        markSeen: false
                    };

                    const stubs = await connection.search(searchCriteria, headerFetchOptions);
                    if (stubs.length === 0) return;

                    console.log(`[EmailService] Found ${stubs.length} candidates in ${boxName}. Checking for new ones...`);

                    // Get message IDs for filtering
                    const stubMap = new Map();
                    stubs.forEach(s => {
                        const headerPart = s.parts.find(p => p.which.includes('HEADER'));
                        const messageId = headerPart?.body?.['message-id']?.[0] || null;
                        if (messageId) {
                            stubMap.set(messageId, s.attributes.uid);
                        } else {
                            // Fallback if no message-id in header (rare)
                            stubMap.set(`uid-${s.attributes.uid}`, s.attributes.uid);
                        }
                    });

                    // Check which Message-IDs we already have in our logs
                    const existingLogs = await EmailLog.find({
                        userId: userId,
                        messageId: { $in: Array.from(stubMap.keys()) }
                    }).select('messageId imapUid');

                    const existingMsgIds = new Set(existingLogs.map(l => l.messageId));

                    // Identify UIDs that are truly new
                    const newUids = [];
                    for (const [msgId, uid] of stubMap.entries()) {
                        if (!existingMsgIds.has(msgId)) {
                            newUids.push(uid);
                        }
                    }

                    if (newUids.length === 0) {
                        console.log(`[EmailService] No new messages in ${boxName}`);
                        return;
                    }

                    // 2. BODY STAGE: Fetch full content only for new UIDs
                    // Limit to 50 per sync to avoid timeouts and heavy loads
                    const uidsToFetch = newUids.slice(0, 50);
                    console.log(`[EmailService] Syncing ${uidsToFetch.length} new messages from ${boxName}`);

                    const fetchOptions = {
                        bodies: [''],
                        markSeen: false
                    };

                    if (folderType === 'inbox' && (criteria && criteria.includes('UNSEEN'))) {
                        fetchOptions.markSeen = true;
                    }

                    // Use the raw imap connection to fetch by UIDs specifically
                    const messages = await connection.search([['UID', uidsToFetch.join(',')]], fetchOptions);

                    for (const item of messages) {
                        const all = item.parts.find(part => part.which === '');
                        if (!all) continue;

                        const id = item.attributes.uid;
                        let parsed;
                        try {
                            parsed = await simpleParser(all.body);
                        } catch (err) {
                            console.error(`[EmailService] ❌ Error parsing UID ${id}:`, err.message);
                            continue;
                        }

                        if (!parsed.messageId) {
                            parsed.messageId = `<imap-uid-${id}@${email.split('@')[1] || 'local'}>`;
                        }

                        const cleanValue = (val) => (val === 'undefined' || val === 'null' || !val) ? null : val;

                        collectedEmails.push({
                            folder: folderType,
                            mailbox: boxName,
                            from: cleanValue(parsed.from?.text) || 'unknown@example.com',
                            to: cleanValue(parsed.to?.text) || email,
                            subject: cleanValue(parsed.subject) || '(No Subject)',
                            text: parsed.text,
                            html: parsed.html,
                            messageId: parsed.messageId,
                            inReplyTo: parsed.inReplyTo,
                            references: parsed.references,
                            date: parsed.date || new Date(),
                            imapUid: id
                        });
                    }
                } catch (err) {
                    console.error(`[EmailService] Error fetching from ${boxName}:`, err.message);
                }
            };

            await fetchFromBox('INBOX', 'inbox');

            const sentBox = await this._detectSentBox(connection);
            if (sentBox) await fetchFromBox(sentBox, 'sent');

            const junkBox = await this._detectJunkBox(connection);
            if (junkBox) await fetchFromBox(junkBox, 'junk');

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

    // Helper to detect junk/spam box
    async _detectJunkBox(connection) {
        const boxes = await connection.getBoxes();
        const candidates = ['Junk', 'Spam', 'Junk E-mail', 'Bulk Mail', 'Spam Messages', 'INBOX.Spam', 'INBOX.Junk'];

        const findJunkBox = (boxList, prefix = '') => {
            for (const key of Object.keys(boxList)) {
                const box = boxList[key];
                const fullPath = prefix + key;
                if (box.attribs && box.attribs.some(a => typeof a === 'string' && (a.toUpperCase() === '\\JUNK' || a.toUpperCase() === '\\SPAM'))) {
                    return fullPath;
                }
                if (box.children) {
                    const childFound = findJunkBox(box.children, fullPath + box.delimiter);
                    if (childFound) return childFound;
                }
            }
            return null;
        };

        let junkBoxName = findJunkBox(boxes);
        if (!junkBoxName) {
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
            if (match) junkBoxName = match;
        }
        return junkBoxName;
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
