import mongoose from 'mongoose';

const minutesPurchaseSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    minutes_purchased: {
        type: Number,
        required: true
    },
    amount_paid: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    payment_method: {
        type: String, // 'stripe', 'manual', 'demo'
        default: 'manual'
    },
    stripe_payment_id: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    notes: {
        type: String,
        required: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update updated_at on save
minutesPurchaseSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

const MinutesPurchase = mongoose.model('MinutesPurchase', minutesPurchaseSchema);

export default MinutesPurchase;
