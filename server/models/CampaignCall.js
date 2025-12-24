import mongoose from 'mongoose';

const campaignCallSchema = new mongoose.Schema({
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true,
        index: true
    },
    // We link either to a Contact or just store info if from CSV (though CsvContact might exist?)
    // For now, let's keep it flexible.
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact' // Optional, if from ContactList
    },
    // Snapshot of contact info at time of call
    phoneNumber: {
        type: String,
        required: true
    },
    contactName: {
        type: String,
        default: 'Unknown'
    },
    email: String,

    status: {
        type: String,
        enum: ['pending', 'calling', 'answered', 'completed', 'failed', 'busy', 'no_answer'],
        default: 'pending'
    },
    outcome: {
        type: String,
        enum: ['none', 'interested', 'not_interested', 'callback', 'do_not_call', 'voicemail'],
        default: 'none'
    },

    // Technical details
    callSid: String, // Twilio/LiveKit SID
    roomName: String,

    startedAt: Date,
    completedAt: Date,
    duration: Number, // seconds
    recordingUrl: String,
    transcript: String,
    summary: String,

    notes: String
}, {
    timestamps: true
});

const CampaignCall = mongoose.model('CampaignCall', campaignCallSchema);

export default CampaignCall;
