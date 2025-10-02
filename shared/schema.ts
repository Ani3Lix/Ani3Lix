import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  integer, 
  boolean, 
  jsonb, 
  uuid,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums for role-based access control
export const roleEnum = pgEnum("role", ["user", "moderator", "admin", "site_owner"]);
export const animeStatusEnum = pgEnum("anime_status", ["draft", "published"]);
export const postTypeEnum = pgEnum("post_type", ["discussion", "announcement", "review"]);

// Users table with immutable UUID and role-based access
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Immutable UUID for user identification
  username: varchar("username", { length: 50 }).notNull().unique(), // Changeable username with 50 char limit
  email: varchar("email", { length: 255 }).notNull().unique(), // User email for authentication
  password: text("password").notNull(), // Hashed password using bcrypt
  displayName: varchar("display_name", { length: 100 }), // User's display name for profile
  bio: text("bio"), // User biography text for profile customization
  avatarUrl: text("avatar_url"), // URL to user's avatar image stored in Supabase Storage
  role: roleEnum("role").notNull().default("user"), // User role for access control
  createdAt: timestamp("created_at").defaultNow().notNull(), // Account creation timestamp
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Last profile update timestamp
  lastUsernameChange: timestamp("last_username_change"), // Track username change for weekly restriction
});

// Anime table storing metadata from AniList API
export const anime = pgTable("anime", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Internal anime ID
  anilistId: integer("anilist_id").unique(), // AniList API reference ID for external data sync
  title: text("title").notNull(), // Anime title from AniList
  description: text("description"), // Anime synopsis and description
  coverImageUrl: text("cover_image_url"), // Cover/poster image URL from AniList
  bannerImageUrl: text("banner_image_url"), // Banner image for hero sections
  status: animeStatusEnum("status").notNull().default("draft"), // Draft/published state for admin workflow
  metadata: jsonb("metadata"), // Flexible JSON storage for AniList metadata (genres, studios, etc.)
  rating: integer("rating"), // Average rating score
  episodeCount: integer("episode_count"), // Total number of episodes
  year: integer("year"), // Release year
  createdBy: uuid("created_by").references(() => users.id), // Admin who added this anime
  createdAt: timestamp("created_at").defaultNow().notNull(), // When anime was added to platform
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Last metadata update
});

// Episodes table linking to anime with external video URLs
export const episodes = pgTable("episodes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Episode unique identifier
  animeId: uuid("anime_id").references(() => anime.id, { onDelete: "cascade" }).notNull(), // Link to parent anime
  episodeNumber: integer("episode_number").notNull(), // Episode number in sequence
  title: text("title"), // Episode title/name
  description: text("description"), // Episode description/summary
  thumbnailUrl: text("thumbnail_url"), // Episode thumbnail image URL
  videoUrl: text("video_url").notNull(), // External video stream URL (not hosted locally)
  duration: integer("duration"), // Episode duration in seconds
  introStart: integer("intro_start"), // Intro start timestamp in seconds for skip functionality
  introEnd: integer("intro_end"), // Intro end timestamp in seconds for skip functionality
  outroStart: integer("outro_start"), // Outro start timestamp in seconds for skip functionality
  createdAt: timestamp("created_at").defaultNow().notNull(), // When episode was added
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Last episode update
});

// Watch history tracking user progress through episodes
export const watchHistory = pgTable("watch_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Watch session identifier
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // User who watched
  animeId: uuid("anime_id").references(() => anime.id, { onDelete: "cascade" }).notNull(), // Anime being watched
  episodeId: uuid("episode_id").references(() => episodes.id, { onDelete: "cascade" }).notNull(), // Specific episode
  progress: integer("progress").notNull().default(0), // Watch progress in seconds
  completed: boolean("completed").notNull().default(false), // Whether episode was fully watched
  watchedAt: timestamp("watched_at").defaultNow().notNull(), // Timestamp of watch session
});

// User watchlist for anime they plan to watch
export const watchlist = pgTable("watchlist", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Watchlist entry identifier
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // User who added to watchlist
  animeId: uuid("anime_id").references(() => anime.id, { onDelete: "cascade" }).notNull(), // Anime in watchlist
  addedAt: timestamp("added_at").defaultNow().notNull(), // When anime was added to watchlist
});

// User favorites for highly rated anime
export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Favorite entry identifier
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // User who favorited
  animeId: uuid("anime_id").references(() => anime.id, { onDelete: "cascade" }).notNull(), // Favorited anime
  addedAt: timestamp("added_at").defaultNow().notNull(), // When anime was favorited
});

// Comments system with nested replies support
export const comments: any = pgTable("comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Comment unique identifier
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // Comment author
  animeId: uuid("anime_id").references(() => anime.id, { onDelete: "cascade" }), // Anime being commented on
  episodeId: uuid("episode_id").references(() => episodes.id, { onDelete: "cascade" }), // Specific episode if applicable
  parentCommentId: uuid("parent_comment_id").references((): any => comments.id, { onDelete: "cascade" }), // For nested replies
  content: text("content").notNull(), // Comment text content
  likes: integer("likes").notNull().default(0), // Number of likes on comment
  isDeleted: boolean("is_deleted").notNull().default(false), // Soft deletion for conversation preservation
  createdAt: timestamp("created_at").defaultNow().notNull(), // Comment creation time
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Last edit time
});

// Community posts and discussions
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Post unique identifier
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // Post author
  title: text("title").notNull(), // Post title
  content: text("content").notNull(), // Post content/body
  type: postTypeEnum("type").notNull().default("discussion"), // Post category
  isPinned: boolean("is_pinned").notNull().default(false), // Admin pinning for important posts
  likes: integer("likes").notNull().default(0), // Post engagement metric
  createdAt: timestamp("created_at").defaultNow().notNull(), // Post creation time
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Last edit time
});

// Role permissions audit trail
export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Permission change identifier
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // User whose role changed
  grantedBy: uuid("granted_by").references(() => users.id).notNull(), // Admin who granted the role
  previousRole: roleEnum("previous_role"), // Previous role before change
  newRole: roleEnum("new_role").notNull(), // New role after change
  reason: text("reason"), // Reason for role change
  grantedAt: timestamp("granted_at").defaultNow().notNull(), // When role was changed
});

// Create insert schemas for form validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
  bio: true,
});

export const insertAnimeSchema = createInsertSchema(anime).pick({
  anilistId: true,
  title: true,
  description: true,
  coverImageUrl: true,
  bannerImageUrl: true,
  metadata: true,
  rating: true,
  episodeCount: true,
  year: true,
  createdBy: true,
});

export const insertEpisodeSchema = createInsertSchema(episodes).pick({
  animeId: true,
  episodeNumber: true,
  title: true,
  description: true,
  thumbnailUrl: true,
  videoUrl: true,
  duration: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  animeId: true,
  episodeId: true,
  parentCommentId: true,
  content: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  content: true,
  type: true,
});

// Type exports for TypeScript usage
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Anime = typeof anime.$inferSelect;
export type InsertAnime = z.infer<typeof insertAnimeSchema>;
export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type WatchHistory = typeof watchHistory.$inferSelect;
export type Watchlist = typeof watchlist.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;

// User role type for role-based access control
export type UserRole = "user" | "moderator" | "admin" | "site_owner";
export type AnimeStatus = "draft" | "published";
export type PostType = "discussion" | "announcement" | "review";
