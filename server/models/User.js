import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'super-admin'],
        default: 'user'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    plan: {
        type: String,
        default: 'free'
    },
    minutes_limit: {
        type: Number,
        default: 0 // 0 means unlimited or default? usually 0 means 0. AdminPanel logic: 0 is Unlimited.
    },
    minutes_used: {
        type: Number,
        default: 0
    },
    company: String,
    industry: String,
    team_size: String,
    use_case: String,
    revenue_range: String,
    pain_points: [String],
    business_type: String,
    theme: String,
    notifications: Boolean,
    goals: mongoose.Schema.Types.Mixed,
    onboarding_completed: Boolean,
    trial_ends_at: Date,
    contact: {
        email: String,
        phone: String,
        countryCode: String
    },
    calendar_integrations: [{
        provider: { type: String, enum: ['google', 'outlook', 'calendly', 'calcom'] },
        accessToken: String,
        refreshToken: String,
        expiresAt: Date,
        email: String,
        // Added for API Key based integrations (e.g. Cal.com)
        api_key: String,
        event_type_id: String,
        event_type_slug: String,
        timezone: String,
        label: String,
        is_active: { type: Boolean, default: true }
    }],
    email_integrations: [{
        provider: { type: String, enum: ['smtp', 'gmail', 'outlook'] }, // simplified for now
        smtpHost: String,
        smtpPort: Number,
        smtpUser: String,
        smtpPass: String, // Encrypt this in production!
        imapHost: String, // For reading
        imapPort: Number,
        imapUser: String,
        imapPass: String,
        email: String,
        isActive: { type: Boolean, default: true }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
// Update timestamp on save
userSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

export default mongoose.model('User', userSchema);
