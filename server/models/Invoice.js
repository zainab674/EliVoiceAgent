import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'usd'
    },
    status: {
        type: String,
        enum: ['paid', 'pending', 'failed', 'void'],
        default: 'pending'
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String
    },
    invoiceNumber: {
        type: String
    },
    stripeInvoiceId: {
        type: String
    },
    pdfUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
