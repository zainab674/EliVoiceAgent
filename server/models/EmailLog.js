import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assistantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assistant'
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailCampaign'
    },
    from: String,
    to: String,
    subject: String,
    body: String, // Or snippet if too large
    direction: {
        type: String,
        enum: ['inbound', 'outbound'],
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'received', 'failed'],
        default: 'sent'
    },
    threadId: String, // Group messages into a conversation
    inReplyTo: String, // Parent message ID
    hasAttachments: Boolean,
    messageId: String, // SMTP Message-ID
    imapUid: Number, // IMAP UID for fast syncing
    mailbox: String, // Box name (INBOX, Sent, etc.)
    error: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

emailLogSchema.index({ userId: 1, createdAt: -1 });
emailLogSchema.index({ userId: 1, imapUid: 1, mailbox: 1 });
emailLogSchema.index({ messageId: 1 });
emailLogSchema.index({ threadId: 1 });

export default mongoose.model('EmailLog', emailLogSchema);
