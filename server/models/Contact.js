import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    list_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ContactList',
        required: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'do-not-call'],
        default: 'active'
    },
    do_not_call: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

export default Contact;
