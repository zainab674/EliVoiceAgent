import mongoose from 'mongoose';

const smsCampaignSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    assistantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assistant',
        required: true
    },
    contactSource: {
        type: String,
        enum: ['contact_list', 'csv_file'],
        required: true
    },
    contactListId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ContactList'
    },
    csvFileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CsvFile'
    },
    // Content
    body: {
        type: String,
        required: true
    },

    // Status
    status: {
        type: String,
        enum: ['draft', 'sending', 'completed', 'failed', 'paused'],
        default: 'draft'
    },

    // Stats
    stats: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        replies: { type: Number, default: 0 }
    },

    // Total expected recipients (snapshot at creation)
    totalRecipients: { type: Number, default: 0 }

}, {
    timestamps: true
});

const SmsCampaign = mongoose.model('SmsCampaign', smsCampaignSchema);

export default SmsCampaign;
