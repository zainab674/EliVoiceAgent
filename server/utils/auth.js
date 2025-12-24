// Authentication utilities for the server
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret123');

    // Get user from the token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: user not found'
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      companyId: user._id.toString(),
      role: user.role
    };
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

/**
 * Middleware to extract user ID from JWT or session (legacy support)
 * This is a placeholder implementation - replace with your actual auth middleware
 */
export const extractUserId = (req, res, next) => {
  try {
    // Extract user ID from headers (for now)
    // In a real implementation, this would:
    // 1. Verify JWT token
    // 2. Extract user info from token
    // 3. Set req.user with full user object

    const userId = req.headers['user-id'] || req.headers['x-user-id'];
    const companyId = req.headers['company-id'] || req.headers['x-company-id'];

    if (!userId) {
      return res.status(401).json({
        error: 'User ID required',
        message: 'Please provide user-id in headers'
      });
    }

    // Set user object on request
    req.user = {
      id: userId,
      companyId: companyId || userId, // Use userId as companyId if not provided
      // Add other user properties as needed
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: error.message
    });
  }
};

/**
 * Middleware to require company ID
 */
export const requireCompanyId = (req, res, next) => {
  if (!req.user?.companyId) {
    return res.status(400).json({
      error: 'Company ID required',
      message: 'Please provide company-id in headers'
    });
  }
  next();
};



/**
 * Middleware to validate file access
 */
export const validateFileAccess = (req, res, next) => {
  const { fileId } = req.params;
  const { companyId } = req.user;

  if (!fileId) {
    return res.status(400).json({
      error: 'File ID required'
    });
  }

  // Add additional validation logic here if needed
  // For example, check if the user has access to this file

  next();
};

export default {
  extractUserId,
  requireCompanyId,
  validateFileAccess
};
