import mongoose from 'mongoose';

const smsMessageSchema = new mongoose.Schema({
    messageSid: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assistantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assistant'
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SmsCampaign'
    },
    toNumber: {
        type: String,
        required: true
    },
    fromNumber: {
        type: String,
        required: true
    },
    body: String,
    direction: {
        type: String,
        enum: ['inbound', 'outbound'],
        required: true
    },
    status: String,
    errorCode: String,
    errorMessage: String,
    numSegments: String,
    price: String,
    priceUnit: String,
    dateCreated: Date,
    dateSent: Date,
    dateUpdated: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('SMSMessage', smsMessageSchema);
