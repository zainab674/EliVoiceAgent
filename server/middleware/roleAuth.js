import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Role-based access control middleware
 * Checks for valid JWT and verifies user role against allowed roles.
 * Supports chaining after 'protect' middleware or standalone usage.
 * 
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ['user', 'admin', 'super-admin'])
 */
export const requireRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      let user = req.user;

      // If user not already attached by previous middleware, try to authenticate
      if (!user) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer')) {
          const token = authHeader.split(' ')[1];
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret123');
            user = await User.findById(decoded.id).select('-password');
          } catch (error) {
            console.error('Token verification failed inside requireRole:', error.message);
            // Fall through to failure
          }
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, access token required or invalid'
        });
      }

      // Check if user is active
      if (user.is_active === false) {
        return res.status(403).json({
          success: false,
          message: 'Account is not active. Please verify your email.'
        });
      }

      // Check if user has required role
      const userRole = user.role || 'user';

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }

      // Attach user data to request if not already there
      if (!req.user) {
        req.user = user;
      }

      next();
    } catch (error) {
      console.error('Role auth middleware error:', error);
      return res.status(500).json({
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware to require tenant ownership
 * User must own the tenant (slug_name matches tenant) or be admin
 */
export const requireTenantOwner = async (req, res, next) => {
  // Deprecated: Tenants removed. Always allow.
  next();
};

export default {
  requireRole,
  requireTenantOwner
};
