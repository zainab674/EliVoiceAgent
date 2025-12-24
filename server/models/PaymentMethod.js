import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['card', 'bank_account'],
        default: 'card'
    },
    cardBrand: {
        type: String
    },
    last4: {
        type: String,
        required: true
    },
    expMonth: {
        type: Number
    },
    expYear: {
        type: Number
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    stripePaymentMethodId: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
export default PaymentMethod;
