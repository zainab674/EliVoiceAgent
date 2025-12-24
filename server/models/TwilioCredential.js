import mongoose from 'mongoose';

const twilioCredentialSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accountSid: String,
    authToken: String,
    trunkSid: String,
    label: String,
    domainName: String,
    domainPrefix: String,
    credentialListSid: String,
    sipUsername: String,
    sipPassword: String,
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

export default mongoose.model('TwilioCredential', twilioCredentialSchema);
