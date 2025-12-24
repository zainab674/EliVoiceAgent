import mongoose from 'mongoose';

const minutesPricingConfigSchema = new mongoose.Schema({
    tenant: {
        type: String,
        required: true,
        unique: true,
        default: 'main'
    },
    price_per_minute: {
        type: Number,
        required: true,
        default: 0.01
    },
    minimum_purchase: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'USD'
    },
    is_active: {
        type: Boolean,
        default: true
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

minutesPricingConfigSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const MinutesPricingConfig = mongoose.model('MinutesPricingConfig', minutesPricingConfigSchema);

export default MinutesPricingConfig;
