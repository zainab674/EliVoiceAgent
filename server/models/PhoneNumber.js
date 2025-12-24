import mongoose from 'mongoose';

const phoneNumberSchema = new mongoose.Schema({
    phoneSid: {
        type: String,
        unique: true
    },
    number: {
        type: String,
        required: true,
        unique: true
    },
    label: String,
    inboundAssistantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assistant'
    },
    webhookStatus: String,
    status: String,
    trunkSid: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('PhoneNumber', phoneNumberSchema);
