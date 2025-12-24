import express from 'express';
import User from '../models/User.js';
import MinutesPricingConfig from '../models/MinutesPricingConfig.js';
import MinutesPurchase from '../models/MinutesPurchase.js';
import { authenticateToken } from '../utils/auth.js';
import { requireRole } from '../middleware/roleAuth.js';

const router = express.Router();

/**
 * GET /api/v1/minutes-pricing
 * Get current pricing for purchasing minutes (authenticated users)
 * - Whitelabel admins see main tenant pricing (set by main admin)
 * - Whitelabel customers see their whitelabel admin's tenant pricing (set by whitelabel admin)
 * - Main tenant users see main tenant pricing
 */
router.get('/minutes-pricing', authenticateToken, async (req, res) => {
    try {
        const pricingTenant = 'main';

        // Get pricing config
        const pricingConfig = await MinutesPricingConfig.findOne({
            tenant: pricingTenant,
            is_active: true
        }).select('price_per_minute minimum_purchase currency');

        // Return default if no config exists
        const pricing = pricingConfig ? pricingConfig.toObject() : {
            price_per_minute: 0.01,
            minimum_purchase: 0,
            currency: 'USD'
        };

        res.json({
            success: true,
            data: pricing
        });
    } catch (error) {
        console.error('Error in GET /minutes-pricing:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/v1/minutes/purchase
 * Purchase minutes (creates pending purchase, to be completed by payment webhook)
 * For whitelabel customers: deducts from whitelabel admin's minutes
 */
router.post('/minutes/purchase', authenticateToken, async (req, res) => {
    try {
        const { minutes } = req.body;

        if (!minutes || typeof minutes !== 'number' || minutes <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid minutes quantity is required'
            });
        }

        // Get user's tenant, role, and pricing
        const user = await User.findById(req.user.id).select('tenant minutes_limit role slug_name');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
        }

        const pricingTenant = 'main';

        // Get pricing config
        const pricingConfig = await MinutesPricingConfig.findOne({
            tenant: pricingTenant,
            is_active: true
        });

        const pricing = pricingConfig ? pricingConfig.toObject() : {
            price_per_minute: 0.01,
            minimum_purchase: 0,
            currency: 'USD'
        };

        // Check minimum purchase
        if (pricing.minimum_purchase > 0 && minutes < pricing.minimum_purchase) {
            return res.status(400).json({
                success: false,
                error: `Minimum purchase is ${pricing.minimum_purchase} minutes`
            });
        }

        // Calculate amount
        const amount = Number((minutes * pricing.price_per_minute).toFixed(2));

        // Add minutes to user's account
        const currentLimit = user.minutes_limit || 0;
        const newLimit = currentLimit + minutes;

        await User.findByIdAndUpdate(req.user.id, { minutes_limit: newLimit });

        // Create purchase record for accounting/history
        const purchase = new MinutesPurchase({
            user_id: req.user.id,
            minutes_purchased: minutes,
            amount_paid: amount,
            currency: pricing.currency,
            payment_method: 'demo', // In production: 'stripe'
            status: 'completed', // In production: 'pending' until webhook confirms
            notes: 'Demo purchase - auto-completed'
        });

        await purchase.save();

        // Get updated user balance
        const updatedUser = await User.findById(req.user.id).select('minutes_limit minutes_used');

        res.json({
            success: true,
            message: `Successfully purchased ${minutes} minutes`,
            data: {
                purchase,
                new_balance: updatedUser?.minutes_limit || 0,
                minutes_used: updatedUser?.minutes_used || 0
            }
        });
    } catch (error) {
        console.error('Error in POST /minutes/purchase:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/v1/minutes/purchase-history
 * Get user's purchase history
 */
router.get('/minutes/purchase-history', authenticateToken, async (req, res) => {
    try {
        const purchases = await MinutesPurchase.find({ user_id: req.user.id })
            .sort({ created_at: -1 })
            .limit(50);

        res.json({
            success: true,
            data: purchases || []
        });
    } catch (error) {
        console.error('Error in GET /minutes/purchase-history:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/v1/admin/customers/:customerId/add-minutes
 * Manually add minutes to a user (admin only, for promotional/support purposes)
 */
router.post('/admin/customers/:customerId/add-minutes', authenticateToken, requireRole(['admin', 'super-admin']), async (req, res) => {
    try {
        const { customerId } = req.params;
        const { minutes, notes } = req.body;

        if (!minutes || typeof minutes !== 'number' || minutes <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid minutes quantity is required'
            });
        }

        // Verify customer exists
        const customer = await User.findById(customerId).select('id name contact minutes_limit');

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        // Add minutes to user's account
        const currentLimit = customer.minutes_limit || 0;
        const newLimit = currentLimit + minutes;

        await User.findByIdAndUpdate(customerId, { minutes_limit: newLimit });

        // Create purchase record for accounting/history
        const purchase = new MinutesPurchase({
            user_id: customerId,
            minutes_purchased: minutes,
            amount_paid: 0,
            currency: 'USD',
            payment_method: 'manual',
            status: 'completed',
            notes: notes || 'Manually added by admin'
        });

        await purchase.save();

        // Get updated balance
        const updatedUser = await User.findById(customerId).select('minutes_limit minutes_used');

        res.json({
            success: true,
            message: `Successfully added ${minutes} minutes to ${customer.name || customer.contact?.email || 'user'}`,
            data: {
                purchase,
                new_balance: updatedUser?.minutes_limit || 0
            }
        });
    } catch (error) {
        console.error('Error in POST /admin/customers/:customerId/add-minutes:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;
