import express from 'express';
import User from '../models/User.js';
import PlanConfig from '../models/PlanConfig.js';
import MinutesPricingConfig from '../models/MinutesPricingConfig.js';
import Assistant from '../models/Assistant.js';
import SMSMessage from '../models/SMSMessage.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

// Middleware to validate admin access
const validateAdminAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Assuming req.user is already populated by authenticateToken with Mongoose doc
    // Note: authenticateToken usually fetches the user.
    // If not, we might need: const user = await User.findById(req.user.id);

    if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Error validating admin access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.use(authenticateToken);
router.use(validateAdminAccess);

/**
 * GET /api/v1/admin/users
 * Fetch all users
 */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, perPage = 50, search } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash') // Exclude sensitive
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    // Transform specifically for frontend requirements if needed, 
    // but the generic JSON should be fine. Frontend expects 'contact.email' but Mongoose has 'email' at top level
    // AdminPanel.tsx interface: contact: { email... }
    // User.js: email (top level)
    // We can map it here or let frontend handle it.
    // AdminPanel.tsx currently handles top level fields too for display logic but interface says nested.
    // Let's provide both to be safe.

    const enrichedUsers = users.map(u => {
      const userObj = u.toObject();
      return {
        ...userObj,
        id: userObj._id,
        contact: {
          email: userObj.email,
          phone: userObj.phone || (userObj.contact && userObj.contact.phone),
          countryCode: userObj.countryCode || (userObj.contact && userObj.contact.countryCode)
        }
      };
    });

    res.json({
      success: true,
      data: enrichedUsers,
      total
    });
  } catch (error) {
    console.error('Error in GET /admin/users:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/v1/admin/users/:userId
 * Update user details
 */
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Protect sensitive fields
    delete updates.password;
    delete updates._id;
    delete updates.createdAt;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error in PUT /admin/users/:userId:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/admin/users/:userId
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /admin/users/:userId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});


/**
 * GET /api/v1/admin/plans
 * Get all plan configs
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await PlanConfig.find({ is_active: true });
    // Transform to expected format (Record<string, PlanConfig>)
    const plansMap = {};
    plans.forEach(plan => {
      plansMap[plan.plan_key] = plan;
    });

    res.json({ success: true, data: plansMap });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

/**
 * POST /api/v1/admin/plans
 * Create or update plan
 */
router.post('/plans', async (req, res) => {
  try {
    const { plan_key, ...data } = req.body;

    // Update or Insert
    const plan = await PlanConfig.findOneAndUpdate(
      { plan_key },
      { ...data, plan_key, is_active: true, updated_at: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Error saving plan:', error);
    res.status(500).json({ success: false, error: 'Failed to save plan' });
  }
});

/**
 * POST /api/v1/admin/plans/:planKey/delete
 * Soft delete/disable plan
 */
router.post('/plans/:planKey/delete', async (req, res) => {
  try {
    const { planKey } = req.params;
    await PlanConfig.findOneAndUpdate(
      { plan_key: planKey },
      { is_active: false }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ success: false, error: 'Failed to delete plan' });
  }
});

/**
 * GET /api/v1/admin/minutes-pricing
 * Get pricing config
 */
router.get('/minutes-pricing', async (req, res) => {
  try {
    const config = await MinutesPricingConfig.findOne({ tenant: 'main' });
    res.json({ success: true, data: config || null });
  } catch (error) {
    console.error('Error getting minutes pricing:', error);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

/**
 * POST /api/v1/admin/minutes-pricing
 * Update pricing config
 */
router.post('/minutes-pricing', async (req, res) => {
  try {
    const config = await MinutesPricingConfig.findOneAndUpdate(
      { tenant: 'main' },
      { ...req.body, tenant: 'main', updated_at: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error saving minutes pricing:', error);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});


/**
 * GET /api/v1/admin/stats/users/:userId
 * Get stats for a single user
 */
router.get('/stats/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('plan');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const assistCount = await Assistant.countDocuments({ user_id: userId });
    const smsCount = await SMSMessage.countDocuments({ user_id: userId });

    // Mock call stats for now until Call model is confirmed
    const callStats = { totalCalls: 0, totalHours: 0 };

    const stats = {
      totalAssistants: assistCount,
      totalCalls: callStats.totalCalls,
      totalHours: callStats.totalHours,
      totalMessages: smsCount,
      plan: user.plan || 'Free'
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/admin/stats/users
 * Bulk stats for all users (Admin dashboard optimizations)
 */
router.get('/stats/users', async (req, res) => {
  try {
    const users = await User.find({}).select('_id plan');

    const statsPromises = users.map(async (user) => {
      const userId = user._id;
      // NOTE: This MIGHT be slow if many users. 

      const assistCount = await Assistant.countDocuments({ user_id: userId });
      const smsCount = await SMSMessage.countDocuments({ user_id: userId });

      // Calls are harder if tied to assistant, need join? 
      // If CallHistory has assistant_id, and Assistant has user_id.
      // We can aggregation: 
      /*
       CallHistory.aggregate([
           { $lookup: { from: 'assistants', localField: 'assistant_id', foreignField: '_id', as: 'assistant' } },
           { $unwind: '$assistant' },
           { $match: { 'assistant.user_id': userId } },
           { $count: 'total' }
       ])
      */
      // For now, simpler:
      // Find user's assistants
      const assistants = await Assistant.find({ user_id: userId }).select('_id');
      const assistantIds = assistants.map(a => a._id);



      return {
        userId,
        stats: {
          totalAssistants: assistCount,
          totalCalls: 0, // TODO: Implement call counting
          totalHours: 0,
          totalMessages: smsCount,
          plan: user.plan || 'Free'
        }
      };
    });

    const results = await Promise.all(statsPromises);
    const statsMap = {};
    results.forEach(r => statsMap[r.userId] = r.stats);

    res.json({ success: true, data: statsMap });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
