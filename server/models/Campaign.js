import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
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
        ref: 'Assistant'
    },
    contactListId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ContactList'
    },
    csvFileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CsvFile'
    },
    contactSource: {
        type: String,
        enum: ['contact_list', 'csv_file'],
        required: true
    },
    // Schedule & Limits
    dailyCap: {
        type: Number,
        default: 100
    },
    callingDays: {
        type: [String],
        default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] // lowercase to match logic
    },
    startHour: {
        type: Number,
        default: 9
    },
    endHour: {
        type: Number,
        default: 17
    },
    // Status
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'completed', 'archived'],
        default: 'draft'
    },
    executionStatus: {
        type: String,
        enum: ['idle', 'running', 'paused', 'completed', 'error'],
        default: 'idle'
    },
    // Prompt override
    campaignPrompt: {
        type: String,
        default: ''
    },
    // Stats (Denormalized for quick access)
    dials: { type: Number, default: 0 },
    pickups: { type: Number, default: 0 },
    doNotCall: { type: Number, default: 0 },
    interested: { type: Number, default: 0 },
    notInterested: { type: Number, default: 0 },
    callback: { type: Number, default: 0 },
    totalUsage: { type: Number, default: 0 }, // in seconds or some unit

    // Execution tracking
    currentDailyCalls: { type: Number, default: 0 },
    lastExecutionAt: { type: Date },
    nextCallAt: { type: Date },

}, {
    timestamps: true
});

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
