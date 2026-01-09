import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact'
    },
    assistantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assistant'
    },
    source: {
        type: String,
        default: 'mongodb'
    },
    data: {
        type: Map,
        of: String
    },
    category: {
        type: String,
        enum: ['small', 'medium', 'growing', 'large', 'none'],
        default: 'none'
    },
    status: {
        type: String,
        enum: ['synced', 'emailed', 'failed'],
        default: 'synced'
    },
    syncedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
