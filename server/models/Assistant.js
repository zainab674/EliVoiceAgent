import mongoose from 'mongoose';

// Ensure any previously compiled Assistant model is removed before defining the schema
if (mongoose.models.Assistant) {
    delete mongoose.models.Assistant;
}

const documentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    path: { type: String, required: true },
    type: { type: String }, // 'pdf', 'docx', etc.
    size: Number,
    uploadedAt: Date
}, { _id: false });


const assistantSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        default: 'My Assistant'
    },
    assignedUserEmail: {
        type: String,
        lowercase: true,
        trim: true
    },
    nodes: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    edges: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    systemPrompt: {
        type: String,
        default: 'You are a helpful legal assistant.'
    },
    firstMessage: { // Renamed from firstSms to be more generic if needed, or keeping aliases
        type: String,
        default: ''
    },

    // Grouped Settings
    modelSettings: {
        type: Object,
        default: {}
    },
    voiceSettings: {
        type: Object,
        default: {}
    },
    smsSettings: {
        type: Object,
        default: {}
    },
    analysisSettings: {
        type: Object,
        default: {}
    },
    advancedSettings: {
        type: Object,
        default: {}
    },
    n8nSettings: {
        type: Object,
        default: {}
    },

    // Data Collection & Intake Settings
    dataCollectionSettings: {
        collectName: { type: Boolean, default: false },
        collectEmail: { type: Boolean, default: false },
        collectPhone: { type: Boolean, default: false },
        // Credential Linking
        linkedEmailId: { type: String, default: "" },
        linkedCalendarId: { type: String, default: "" }
    },

    // Document & Email Features
    assigned_documents: {
        type: [documentSchema],
        default: []
    },
    email_templates: {
        post_call: {
            subject: { type: String, default: 'Information from our call' },
            body: { type: String, default: 'Hi, thanks for speaking with us. Here are the documents you requested.' },
            sender: String
        },
        follow_up: {
            subject: String,
            body: String
        }
    },

    // Keep top-level for query ease if needed, but mostly rely on blocks above
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Delete cached model to force recompilation with new schema
if (mongoose.models.Assistant) {
    delete mongoose.models.Assistant;
}

export default mongoose.model('Assistant', assistantSchema);
