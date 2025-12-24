import express from 'express';
import User from '../models/User.js';
import MinutesPricingConfig from '../models/MinutesPricingConfig.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

// Middleware to validate admin access
const validateAdminAccess = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Error validating admin access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/v1/minutes
 * Get current user's minutes information
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const minutesLimit = user.minutes_limit || 0;
    const minutesUsed = user.minutes_used || 0;
    const remainingMinutes = Math.max(0, minutesLimit - minutesUsed);
    const percentageUsed = minutesLimit > 0
      ? Math.round((minutesUsed / minutesLimit) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalMinutes: minutesLimit,
        usedMinutes: minutesUsed,
        remainingMinutes,
        percentageUsed,
        planName: user.plan || 'Free Plan'
      }
    });
  } catch (error) {
    console.error('Error in GET /minutes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Helper function to validate minutes distribution
 */
const validateMinutesDistribution = async (adminUserId, newMinutes, customerId = null) => {
  try {
    const admin = await User.findById(adminUserId);

    if (!admin) {
      return { valid: false, error: 'Tenant admin not found' };
    }

    const adminMinutes = admin.minutes_limit || 0;

    // If admin has unlimited minutes (0), allow any distribution
    if (adminMinutes === 0) {
      return { valid: true, adminMinutes: 0, currentTotal: 0, newTotal: newMinutes };
    }

    // Prevent setting customer to unlimited (0) unless admin also has unlimited
    if (newMinutes === 0 && adminMinutes > 0) {
      return {
        valid: false,
        error: `Cannot set customer to unlimited minutes. Admin has limited plan (${adminMinutes} minutes). Only admins with unlimited plans can assign unlimited minutes to customers.`
      };
    }

    // Get sum of all customer minutes (excluding the admin)
    // Assuming "customers" are all other users.
    // In a real multi-tenant system, we would filter by tenant_id.
    // For now, we sum all users except me.

    const customers = await User.find({ _id: { $ne: adminUserId } }).select('minutes_limit');

    // Calculate current total minutes allocated to customers
    const currentTotal = customers.reduce((sum, customer) => {
      // If updating existing customer, exclude their current minutes (handled by looking up customerId, actually we should just exclude customerId from the sum query or filter locally)
      // If customerId matches this customer, we skip it because we are validating the *new* total including the new value for this customer passed in `newMinutes`
      // Wait, `newMinutes` is the NEW LIMIT for the customer.

      if (customerId && customer._id.toString() === customerId) {
        return sum;
      }

      const customerMinutes = customer.minutes_limit || 0;
      return customerMinutes > 0 ? sum + customerMinutes : sum;
    }, 0);

    const newTotal = currentTotal + newMinutes;

    if (newTotal > adminMinutes) {
      const available = adminMinutes - currentTotal;
      return {
        valid: false,
        error: `Cannot allocate ${newMinutes} minutes. Available: ${available} minutes (Admin has ${adminMinutes} total, ${currentTotal} already allocated)`,
        adminMinutes,
        currentTotal,
        newTotal
      };
    }

    return {
      valid: true,
      adminMinutes,
      currentTotal,
      newTotal
    };

  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * POST /api/v1/minutes/assign
 * Whitelabel admin endpoint to assign minutes to a customer
 */
router.post('/assign', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { userId, minutes } = req.body;

    if (!userId || minutes === undefined || minutes === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, minutes'
      });
    }

    if (typeof minutes !== 'number' || minutes <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Minutes must be a positive number'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Target user not found'
      });
    }

    if (targetUser.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot assign minutes to admin users'
      });
    }

    const currentLimit = targetUser.minutes_limit || 0;
    const newLimit = currentLimit + minutes; // Wait! The original logic was newLimit = currentLimit + minutes?
    // Let's re-read: "const newLimit = currentLimit + minutes;" YES. It adds to the limit.

    const validation = await validateMinutesDistribution(
      req.user.id,
      newLimit,
      userId
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        details: {
          adminMinutes: validation.adminMinutes,
          currentTotal: validation.currentTotal,
          requested: newLimit,
          customerCurrentMinutes: currentLimit
        }
      });
    }

    // Update user
    targetUser.minutes_limit = newLimit;
    await targetUser.save();

    res.json({
      success: true,
      message: `Successfully assigned ${minutes} minutes to user`,
      data: {
        userId,
        previousLimit: currentLimit,
        newLimit: targetUser.minutes_limit,
        minutesAdded: minutes,
        minutesUsed: targetUser.minutes_used || 0,
        remainingMinutes: Math.max(0, targetUser.minutes_limit - (targetUser.minutes_used || 0))
      }
    });

  } catch (error) {
    console.error('Error in POST /minutes/assign:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/v1/minutes/deduct
 * Internal endpoint to deduct minutes after a call
 */
router.post('/deduct', async (req, res) => {
  try {
    const serviceKey = req.headers['x-service-key'];
    const expectedServiceKey = process.env.SERVICE_ROLE_KEY || process.env.ADMIN_API_KEY; // Using generic name slightly

    if (serviceKey !== expectedServiceKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - service key required'
      });
    }

    const { userId, minutes } = req.body;

    if (!userId || minutes === undefined || minutes === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, minutes'
      });
    }

    if (typeof minutes !== 'number' || minutes < 0) {
      return res.status(400).json({
        success: false,
        error: 'Minutes must be a non-negative number'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const currentUsed = user.minutes_used || 0;
    const newUsed = currentUsed + minutes;

    user.minutes_used = newUsed;
    await user.save();

    const minutesLimit = user.minutes_limit || 0;
    const remainingMinutes = Math.max(0, minutesLimit - newUsed);
    const exceededLimit = minutesLimit > 0 && newUsed > minutesLimit;

    res.json({
      success: true,
      data: {
        userId,
        minutesDeducted: minutes,
        previousUsed: currentUsed,
        newUsed,
        minutesLimit,
        remainingMinutes,
        exceededLimit
      }
    });
  } catch (error) {
    console.error('Error in POST /minutes/deduct:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;



