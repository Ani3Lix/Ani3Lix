import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { UserRole, User } from "@shared/schema";

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: User; // Authenticated user object
      userId?: string; // Quick access to user ID
    }
  }
}

// JWT payload interface for type safety
interface JWTPayload {
  userId: string; // User ID for database lookups
  username: string; // Username for quick reference
  role: UserRole; // User role for permission checks
  iat?: number; // Token issued at timestamp
  exp?: number; // Token expiration timestamp
}

// Get JWT secret from environment variables with fallback
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback_secret_key";
const JWT_EXPIRES_IN = "15m"; // Short-lived access tokens for security
const REFRESH_TOKEN_EXPIRES_IN = "7d"; // Longer-lived refresh tokens

// Authentication middleware to verify JWT tokens
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer token format
    
    if (!token) {
      return res.status(401).json({ 
        error: "Access token required",
        message: "Please provide a valid authentication token" 
      });
    }

    // Verify and decode JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Fetch full user data from database for current permissions
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: "Invalid token",
        message: "User account not found or has been deleted" 
      });
    }

    // Attach user data to request for use in route handlers
    req.user = user;
    req.userId = user.id;
    
    next(); // Proceed to protected route
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: "Token expired",
        message: "Please refresh your authentication token" 
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: "Invalid token",
        message: "Authentication token is malformed or invalid" 
      });
    } else {
      console.error("Authentication error:", error);
      return res.status(500).json({ 
        error: "Authentication failed",
        message: "Unable to verify authentication token" 
      });
    }
  }
};

// Role-based authorization middleware factory
export const requireRole = (minimumRole: UserRole) => {
  // Define role hierarchy for permission checking
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,          // Basic user permissions
    moderator: 2,     // Comment/content moderation
    admin: 3,         // Anime management and user roles
    site_owner: 4,    // Full system access
  };

  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({ 
        error: "Authentication required",
        message: "Please log in to access this resource" 
      });
    }

    // Check if user role meets minimum requirement
    const userRoleLevel = roleHierarchy[req.user.role];
    const requiredRoleLevel = roleHierarchy[minimumRole];

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        message: `${minimumRole} role or higher required for this action`,
        userRole: req.user.role,
        requiredRole: minimumRole
      });
    }

    next(); // User has sufficient permissions
  };
};

// Specific middleware functions for common role checks
export const requireAuth = authenticateToken; // Alias for clarity
export const requireModerator = [authenticateToken, requireRole("moderator")];
export const requireAdmin = [authenticateToken, requireRole("admin")];
export const requireSiteOwner = [authenticateToken, requireRole("site_owner")];

// Optional authentication middleware for public endpoints with user data
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // If token provided, try to authenticate
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      const user = await storage.getUser(decoded.userId);
      
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    
    // Continue regardless of authentication status
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

// Utility function to generate JWT tokens
export const generateTokens = (user: User) => {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  // Generate short-lived access token for API requests
  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: "ani3lix-api",
    audience: "ani3lix-client"
  });

  // Generate longer-lived refresh token for token renewal
  const refreshToken = jwt.sign(
    { userId: user.id }, 
    JWT_SECRET, 
    { 
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: "ani3lix-api",
      audience: "ani3lix-refresh"
    }
  );

  return { accessToken, refreshToken };
};

// Verify refresh token and return user ID
export const verifyRefreshToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null; // Invalid or expired refresh token
  }
};
