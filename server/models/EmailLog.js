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
    error: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('EmailLog', emailLogSchema);
