import mongoose from 'mongoose';

const contactListSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const ContactList = mongoose.models.ContactList || mongoose.model('ContactList', contactListSchema);

export default ContactList;
