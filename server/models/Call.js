import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // May not verify user for inbound webhook calls immediately, or may rely on assistant_id lookup
    },
    assistant_id: {
        type: String,
        required: false
    },
    phone_number: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        default: ''
    },
    last_name: {
        type: String,
        default: ''
    },
    client_name: {
        type: String,
        default: ''
    },
    client_email: {
        type: String,
        default: ''
    },
    participant_identity: {
        type: String,
        default: ''
    },
    start_time: {
        type: Date,
        default: Date.now
    },
    end_time: {
        type: Date
    },
    duration: {
        type: Number, // In seconds
        default: 0
    },
    type: {
        type: String, // 'inbound' or 'outbound'
        default: 'inbound'
    },
    status: {
        type: String,
        default: 'completed'
    },
    call_outcome: {
        type: String,
        default: ''
    },
    summary: {
        type: String,
        default: ''
    },
    transcript: {
        type: mongoose.Schema.Types.Mixed, // Array or Object representing the transcript
        default: []
    },
    structured_data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    call_sid: {
        type: String,
        default: ''
    },
    call_id: {
        type: String,
        default: ''
    },
    recording_sid: {
        type: String,
        default: ''
    },
    recording_url: {
        type: String,
        default: ''
    },
    analysis: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Call = mongoose.models.Call || mongoose.model('Call', callSchema);

export default Call;
