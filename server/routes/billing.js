import express from 'express';
import PaymentMethod from '../models/PaymentMethod.js';
import Invoice from '../models/Invoice.js';
import MinutesPurchase from '../models/MinutesPurchase.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

// @desc    Get user payment methods
// @route   GET /api/v1/billing/payment-methods
// @access  Private
router.get('/payment-methods', authenticateToken, async (req, res) => {
    try {
        const paymentMethods = await PaymentMethod.find({
            userId: req.user.id,
            isActive: true
        }).sort({ isDefault: -1, createdAt: -1 });

        // Transform to match frontend expectations if necessary
        // We will return data that matches, but camelCase is better for JSON. 
        // Backend returns what we store. Frontend might need adjustments or we map here.
        // Let's map here to match the structure expected by the frontend roughly, 
        // to minimize frontend changes, or assume we will update frontend.
        // Update: We are rewriting frontend `BillingSettings` anyway, so standard JSON (camelCase) is fine.

        res.json({ success: true, paymentMethods });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc    Get user invoices
// @route   GET /api/v1/billing/invoices
// @access  Private
router.get('/invoices', authenticateToken, async (req, res) => {
    try {
        const invoices = await Invoice.find({ userId: req.user.id })
            .sort({ date: -1 })
            .limit(20);

        // Also fetch minutes purchases as they are treated as invoices in the UI
        const purchases = await MinutesPurchase.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);

        // Combine and map
        // We will return two lists or a combined list.
        // Frontend `BillingSettings.tsx` fetched both. Let's return them separately to match logic or combined.
        // I'll return them as `invoices` and `minutesPurchases` in the response.

        res.json({ success: true, invoices, minutesPurchases: purchases });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

export default router;
