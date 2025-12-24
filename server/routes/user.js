import express from 'express';
import { authenticateToken } from '../utils/auth.js';
import crypto from 'crypto';
import User from '../models/User.js';

const router = express.Router();

/**
 * Complete signup with white label support
 * POST /api/v1/user/complete-signup
 */
router.post('/complete-signup', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }



    // Send verification email via generic email service if configured
    // For now, simpler: just return success.

    res.json({ success: true, message: 'Signup completed successfully' });

  } catch (error) {
    console.error('Error in complete-signup:', error);
    res.status(500).json({ success: false, message: 'An error occurred during signup' });
  }
});

/**
 * Change password (requires authentication)
 * POST /api/v1/user/change-password
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Both old and new passwords are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify old password
    const isMatch = await user.comparePassword(old_password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid old password' });
    }

    // Update password
    user.passwordHash = new_password; // Will be hashed by pre-save hook
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('Error in change-password:', error);
    res.status(500).json({ success: false, message: 'An error occurred while changing password' });
  }
});

/**
 * Delete user account
 * POST /api/v1/user/delete-account
 */
router.post('/delete-account', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    // Ideally this should be a cascaded delete or background job.

    res.json({ success: true, message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting account' });
  }
});

/**
 * Get User Profile
 * GET /api/v1/user/profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

/**
 * Update User Profile
 * PUT /api/v1/user/profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, company, industry, role } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (company) updates.company = company;
    if (industry) updates.industry = industry;
    if (role) updates.role = role;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

// @desc    Get user usage stats
// @route   GET /api/v1/user/usage
// @access  Private
import Assistant from '../models/Assistant.js';
import Call from '../models/Call.js';
import SMSMessage from '../models/SMSMessage.js';

router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Helpers
    const assistants = await Assistant.find({ userId }).select('_id');
    const assistantIds = assistants.map(a => a._id);

    // 2. Counts
    // API Calls (Calls this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const apiCallsCount = await Call.countDocuments({
      user_id: userId,
      created_at: { $gte: startOfMonth }
    });

    // Phone Minutes (sum duration)
    const calls = await Call.find({
      user_id: userId,
      created_at: { $gte: startOfMonth }
    }).select('call_duration');

    const totalDurationSeconds = calls.reduce((sum, call) => sum + (call.call_duration || 0), 0);
    const totalDurationMinutes = Math.round(totalDurationSeconds / 60);

    // SMS Messages
    const smsCount = await SMSMessage.countDocuments({
      userId: userId,
      dateCreated: { $gte: startOfMonth }
    });

    // Team Members (Mock logic for now, or check User collection if there's a team field)
    // defaulting to 1 (just the user)
    const teamMembersCount = 1;

    // Storage (Mock logic)
    const storageUsed = 0;

    res.json({
      calls: { count: apiCallsCount },
      minutes: { count: totalDurationMinutes },
      sms: { count: smsCount },
      users: { count: teamMembersCount },
      storage: { used: storageUsed }
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
