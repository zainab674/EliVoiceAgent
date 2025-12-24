import express from 'express';
import PlanConfig from '../models/PlanConfig.js';

const router = express.Router();

/**
 * GET /api/v1/plans
 * Get all active plan configs (Public)
 */
router.get('/', async (req, res) => {
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

export default router;
