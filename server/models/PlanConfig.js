import mongoose from 'mongoose';

const planConfigSchema = new mongoose.Schema({
    plan_key: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    features: [{
        type: String
    }],
    is_active: {
        type: Boolean,
        default: true
    },
    tenant: {
        type: String,
        default: null
    },
    whitelabel_enabled: {
        type: Boolean,
        default: false
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

planConfigSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const PlanConfig = mongoose.model('PlanConfig', planConfigSchema);

export default PlanConfig;
