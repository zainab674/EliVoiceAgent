import mongoose from 'mongoose';

const callQueueSchema = new mongoose.Schema({
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true,
        index: true
    },
    campaignCallId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CampaignCall',
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'queued',
        index: true
    },
    priority: {
        type: Number,
        default: 0
    },
    scheduledFor: {
        type: Date,
        default: Date.now,
        index: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    lastAttemptAt: Date,

}, {
    timestamps: true
});

const CallQueue = mongoose.model('CallQueue', callQueueSchema);

export default CallQueue;
