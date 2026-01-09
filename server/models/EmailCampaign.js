import mongoose from 'mongoose';

const emailCampaignSchema = new mongoose.Schema({
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
    emailIntegrationId: { // The "Sender" account
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User.email_integrations', // Not a real ref, just an ID from the User's integrations array
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
    subject: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    link: {
        type: String
    },
    attachmentPath: {
        type: String
    },
    attachmentOriginalName: {
        type: String
    },
    imagePath: {
        type: String
    },
    imageOriginalName: {
        type: String
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

const EmailCampaign = mongoose.model('EmailCampaign', emailCampaignSchema);

export default EmailCampaign;
