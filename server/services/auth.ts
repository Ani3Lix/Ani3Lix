import bcrypt from "bcrypt";
import { storage } from "../storage";
import { InsertUser, User, UserRole } from "@shared/schema";
import { generateTokens } from "../middleware/auth";

// Configuration constants for security
const SALT_ROUNDS = 12; // bcrypt salt rounds for password hashing
const USERNAME_CHANGE_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Authentication service for user management and security
export class AuthService {
  // Register new user with password hashing and validation
  async registerUser(userData: InsertUser): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    // Check if username is already taken
    const existingUserByUsername = await storage.getUserByUsername(userData.username);
    if (existingUserByUsername) {
      throw new Error("Username already exists");
    }

    // Check if email is already registered
    const existingUserByEmail = await storage.getUserByEmail(userData.email);
    if (existingUserByEmail) {
      throw new Error("Email already registered");
    }

    // Validate username format and length
    if (userData.username.length < 3 || userData.username.length > 50) {
      throw new Error("Username must be between 3 and 50 characters");
    }

    // Validate password strength
    if (userData.password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Hash password using bcrypt with salt
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Create user with hashed password
    const newUser = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    // Generate authentication tokens
    const tokens = generateTokens(newUser);

    return { user: newUser, tokens };
  }

  // Authenticate user login with email/username and password
  async loginUser(identifier: string, password: string): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    // Find user by email or username
    let user = await storage.getUserByEmail(identifier);
    if (!user) {
      user = await storage.getUserByUsername(identifier);
    }

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate new authentication tokens
    const tokens = generateTokens(user);

    return { user, tokens };
  }

  // Update user password with current password verification
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user password in database
    await storage.updateUser(userId, { password: hashedNewPassword });
  }

  // Update username with cooldown restriction
  async changeUsername(userId: string, newUsername: string): Promise<User> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check username change cooldown (once per week)
    if (user.lastUsernameChange) {
      const timeSinceLastChange = Date.now() - user.lastUsernameChange.getTime();
      if (timeSinceLastChange < USERNAME_CHANGE_COOLDOWN) {
        const daysRemaining = Math.ceil((USERNAME_CHANGE_COOLDOWN - timeSinceLastChange) / (24 * 60 * 60 * 1000));
        throw new Error(`Username can only be changed once per week. Please wait ${daysRemaining} more days.`);
      }
    }

    // Validate new username format
    if (newUsername.length < 3 || newUsername.length > 50) {
      throw new Error("Username must be between 3 and 50 characters");
    }

    // Check if new username is available
    const existingUser = await storage.getUserByUsername(newUsername);
    if (existingUser && existingUser.id !== userId) {
      throw new Error("Username already taken");
    }

    // Update username and timestamp
    const updatedUser = await storage.updateUser(userId, {
      username: newUsername,
      lastUsernameChange: new Date(),
    });

    if (!updatedUser) {
      throw new Error("Failed to update username");
    }

    return updatedUser;
  }

  // Update user profile information
  async updateProfile(userId: string, profileData: { displayName?: string; bio?: string; avatarUrl?: string }): Promise<User> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate display name length if provided
    if (profileData.displayName && profileData.displayName.length > 100) {
      throw new Error("Display name must be 100 characters or less");
    }

    // Validate bio length if provided
    if (profileData.bio && profileData.bio.length > 500) {
      throw new Error("Bio must be 500 characters or less");
    }

    // Update user profile
    const updatedUser = await storage.updateUser(userId, profileData);
    if (!updatedUser) {
      throw new Error("Failed to update profile");
    }

    return updatedUser;
  }

  // Admin function to change user roles
  async changeUserRole(targetUserId: string, newRole: UserRole, adminUserId: string, reason?: string): Promise<void> {
    const admin = await storage.getUser(adminUserId);
    if (!admin) {
      throw new Error("Admin user not found");
    }

    const targetUser = await storage.getUser(targetUserId);
    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Validate admin permissions based on role hierarchy
    if (admin.role === "admin") {
      // Admins can only promote to moderator, not other admins or site_owner
      if (newRole === "admin" || newRole === "site_owner") {
        throw new Error("Admins cannot create other admins or site owners");
      }
    } else if (admin.role === "site_owner") {
      // Site owner can change any role
    } else {
      throw new Error("Insufficient permissions to change user roles");
    }

    // Prevent demoting the last site owner
    if (targetUser.role === "site_owner" && newRole !== "site_owner") {
      const siteOwners = await storage.getUsersByRole("site_owner");
      if (siteOwners.length <= 1) {
        throw new Error("Cannot demote the last site owner");
      }
    }

    // Update user role with audit trail
    await storage.updateUserRole(targetUserId, newRole, adminUserId, reason);
  }

  // Validate user permissions for specific actions
  hasPermission(user: User, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      moderator: 2,
      admin: 3,
      site_owner: 4,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  // Check if user can modify content (own content or has moderation rights)
  canModifyContent(user: User, contentUserId: string): boolean {
    return user.id === contentUserId || this.hasPermission(user, "moderator");
  }
}

// Export service instance
export const authService = new AuthService();
