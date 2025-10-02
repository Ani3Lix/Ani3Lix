import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import {
  users,
  anime,
  episodes,
  watchHistory,
  watchlist,
  favorites,
  comments,
  posts,
  rolePermissions,
  type User,
  type InsertUser,
  type Anime,
  type InsertAnime,
  type Episode,
  type InsertEpisode,
  type Comment,
  type InsertComment,
  type Post,
  type InsertPost,
  type WatchHistory,
  type Watchlist,
  type Favorite,
  type UserRole,
  type AnimeStatus,
} from "@shared/schema";

// Initialize database connection using Neon serverless PostgreSQL
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = neon(connectionString);
const db = drizzle(client);

// Storage interface defining all CRUD operations
export interface IStorage {
  // User management operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserRole(userId: string, newRole: UserRole, grantedBy: string, reason?: string): Promise<void>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  
  // Anime management operations
  getAnime(id: string): Promise<Anime | undefined>;
  getAnimeByAnilistId(anilistId: number): Promise<Anime | undefined>;
  createAnime(anime: InsertAnime): Promise<Anime>;
  updateAnime(id: string, updates: Partial<Anime>): Promise<Anime | undefined>;
  getAnimeByStatus(status: AnimeStatus): Promise<Anime[]>;
  searchAnime(query: string, status?: AnimeStatus): Promise<Anime[]>;
  getTrendingAnime(): Promise<Anime[]>;
  getPublishedAnime(): Promise<Anime[]>;
  
  // Episode management operations
  getEpisode(id: string): Promise<Episode | undefined>;
  getEpisodesByAnime(animeId: string): Promise<Episode[]>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: string, updates: Partial<Episode>): Promise<Episode | undefined>;
  deleteEpisode(id: string): Promise<void>;
  
  // Watch history operations
  getUserWatchHistory(userId: string): Promise<WatchHistory[]>;
  updateWatchProgress(userId: string, episodeId: string, progress: number, completed: boolean): Promise<void>;
  getWatchProgress(userId: string, episodeId: string): Promise<WatchHistory | undefined>;
  getContinueWatching(userId: string): Promise<any[]>;
  
  // Watchlist operations
  getUserWatchlist(userId: string): Promise<Watchlist[]>;
  addToWatchlist(userId: string, animeId: string): Promise<void>;
  removeFromWatchlist(userId: string, animeId: string): Promise<void>;
  isInWatchlist(userId: string, animeId: string): Promise<boolean>;
  
  // Favorites operations
  getUserFavorites(userId: string): Promise<Favorite[]>;
  addToFavorites(userId: string, animeId: string): Promise<void>;
  removeFromFavorites(userId: string, animeId: string): Promise<void>;
  isInFavorites(userId: string, animeId: string): Promise<boolean>;
  
  // Comments operations
  getCommentsByAnime(animeId: string): Promise<Comment[]>;
  getCommentsByEpisode(episodeId: string): Promise<Comment[]>;
  createComment(comment: InsertComment & { userId: string }): Promise<Comment>;
  updateComment(id: string, content: string): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<void>;
  likeComment(commentId: string): Promise<void>;
  
  // Posts operations
  getPosts(): Promise<Post[]>;
  getPostsByUser(userId: string): Promise<Post[]>;
  createPost(post: InsertPost & { userId: string }): Promise<Post>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: string): Promise<void>;
}

// PostgreSQL storage implementation
export class PostgreSQLStorage implements IStorage {
  // User management methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserRole(userId: string, newRole: UserRole, grantedBy: string, reason?: string): Promise<void> {
    // Get current user to track previous role
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    // Update user role
    await db.update(users)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Record role change in audit trail
    await db.insert(rolePermissions).values({
      userId,
      grantedBy,
      previousRole: user.role,
      newRole,
      reason,
      grantedAt: new Date(),
    });
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Anime management methods
  async getAnime(id: string): Promise<Anime | undefined> {
    const result = await db.select().from(anime).where(eq(anime.id, id)).limit(1);
    return result[0];
  }

  async getAnimeByAnilistId(anilistId: number): Promise<Anime | undefined> {
    const result = await db.select().from(anime).where(eq(anime.anilistId, anilistId)).limit(1);
    return result[0];
  }

  async createAnime(animeData: InsertAnime): Promise<Anime> {
    const result = await db.insert(anime).values({
      ...animeData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateAnime(id: string, updates: Partial<Anime>): Promise<Anime | undefined> {
    const result = await db.update(anime)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(anime.id, id))
      .returning();
    return result[0];
  }

  async getAnimeByStatus(status: AnimeStatus): Promise<Anime[]> {
    return await db.select().from(anime)
      .where(eq(anime.status, status))
      .orderBy(desc(anime.createdAt));
  }

  async searchAnime(query: string, status?: AnimeStatus): Promise<Anime[]> {
    const titleCondition = ilike(anime.title, `%${query}%`);
    const whereClause = status 
      ? and(titleCondition, eq(anime.status, status))
      : titleCondition;
    
    return await db.select().from(anime)
      .where(whereClause)
      .orderBy(desc(anime.createdAt));
  }

  async getTrendingAnime(): Promise<Anime[]> {
    // Get trending anime based on recent watch activity
    return await db.select().from(anime)
      .where(eq(anime.status, "published"))
      .orderBy(desc(anime.rating))
      .limit(12);
  }

  async getPublishedAnime(): Promise<Anime[]> {
    return await db.select().from(anime)
      .where(eq(anime.status, "published"))
      .orderBy(desc(anime.createdAt));
  }

  // Episode management methods
  async getEpisode(id: string): Promise<Episode | undefined> {
    const result = await db.select().from(episodes).where(eq(episodes.id, id)).limit(1);
    return result[0];
  }

  async getEpisodesByAnime(animeId: string): Promise<Episode[]> {
    return await db.select().from(episodes)
      .where(eq(episodes.animeId, animeId))
      .orderBy(episodes.episodeNumber);
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const result = await db.insert(episodes).values({
      ...episode,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateEpisode(id: string, updates: Partial<Episode>): Promise<Episode | undefined> {
    const result = await db.update(episodes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(episodes.id, id))
      .returning();
    return result[0];
  }

  async deleteEpisode(id: string): Promise<void> {
    await db.delete(episodes).where(eq(episodes.id, id));
  }

  // Watch history methods
  async getUserWatchHistory(userId: string): Promise<WatchHistory[]> {
    return await db.select().from(watchHistory)
      .where(eq(watchHistory.userId, userId))
      .orderBy(desc(watchHistory.watchedAt));
  }

  async updateWatchProgress(userId: string, episodeId: string, progress: number, completed: boolean): Promise<void> {
    // Check if watch history entry exists
    const existing = await db.select().from(watchHistory)
      .where(and(
        eq(watchHistory.userId, userId),
        eq(watchHistory.episodeId, episodeId)
      )).limit(1);

    if (existing.length > 0) {
      // Update existing entry
      await db.update(watchHistory)
        .set({ progress, completed, watchedAt: new Date() })
        .where(and(
          eq(watchHistory.userId, userId),
          eq(watchHistory.episodeId, episodeId)
        ));
    } else {
      // Create new entry - need to get anime ID from episode
      const episode = await this.getEpisode(episodeId);
      if (!episode) throw new Error("Episode not found");

      await db.insert(watchHistory).values({
        userId,
        animeId: episode.animeId,
        episodeId,
        progress,
        completed,
        watchedAt: new Date(),
      });
    }
  }

  async getWatchProgress(userId: string, episodeId: string): Promise<WatchHistory | undefined> {
    const result = await db.select().from(watchHistory)
      .where(and(
        eq(watchHistory.userId, userId),
        eq(watchHistory.episodeId, episodeId)
      )).limit(1);
    return result[0];
  }

  async getContinueWatching(userId: string): Promise<any[]> {
    // Get recent watch history with incomplete episodes
    const query = sql`
      SELECT DISTINCT ON (wh.anime_id) 
        wh.*,
        a.title as anime_title,
        a.cover_image_url as anime_cover,
        e.title as episode_title,
        e.episode_number,
        e.duration
      FROM ${watchHistory} wh
      JOIN ${anime} a ON wh.anime_id = a.id
      JOIN ${episodes} e ON wh.episode_id = e.id
      WHERE wh.user_id = ${userId} 
        AND wh.completed = false
        AND wh.progress > 0
      ORDER BY wh.anime_id, wh.watched_at DESC
      LIMIT 8
    `;
    
    const result = await db.execute(query);
    return result.rows as any[];
  }

  // Watchlist methods
  async getUserWatchlist(userId: string): Promise<Watchlist[]> {
    return await db.select().from(watchlist)
      .where(eq(watchlist.userId, userId))
      .orderBy(desc(watchlist.addedAt));
  }

  async addToWatchlist(userId: string, animeId: string): Promise<void> {
    await db.insert(watchlist).values({
      userId,
      animeId,
      addedAt: new Date(),
    });
  }

  async removeFromWatchlist(userId: string, animeId: string): Promise<void> {
    await db.delete(watchlist).where(and(
      eq(watchlist.userId, userId),
      eq(watchlist.animeId, animeId)
    ));
  }

  async isInWatchlist(userId: string, animeId: string): Promise<boolean> {
    const result = await db.select().from(watchlist)
      .where(and(
        eq(watchlist.userId, userId),
        eq(watchlist.animeId, animeId)
      )).limit(1);
    return result.length > 0;
  }

  // Favorites methods
  async getUserFavorites(userId: string): Promise<Favorite[]> {
    return await db.select().from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.addedAt));
  }

  async addToFavorites(userId: string, animeId: string): Promise<void> {
    await db.insert(favorites).values({
      userId,
      animeId,
      addedAt: new Date(),
    });
  }

  async removeFromFavorites(userId: string, animeId: string): Promise<void> {
    await db.delete(favorites).where(and(
      eq(favorites.userId, userId),
      eq(favorites.animeId, animeId)
    ));
  }

  async isInFavorites(userId: string, animeId: string): Promise<boolean> {
    const result = await db.select().from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.animeId, animeId)
      )).limit(1);
    return result.length > 0;
  }

  // Comments methods
  async getCommentsByAnime(animeId: string): Promise<Comment[]> {
    return await db.select().from(comments)
      .where(and(
        eq(comments.animeId, animeId),
        eq(comments.isDeleted, false)
      ))
      .orderBy(desc(comments.createdAt));
  }

  async getCommentsByEpisode(episodeId: string): Promise<Comment[]> {
    return await db.select().from(comments)
      .where(and(
        eq(comments.episodeId, episodeId),
        eq(comments.isDeleted, false)
      ))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment & { userId: string }): Promise<Comment> {
    const result = await db.insert(comments).values({
      ...comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning() as Comment[];
    return result[0];
  }

  async updateComment(id: string, content: string): Promise<Comment | undefined> {
    const result = await db.update(comments)
      .set({ content, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return result[0];
  }

  async deleteComment(id: string): Promise<void> {
    // Soft delete to preserve conversation context
    await db.update(comments)
      .set({ isDeleted: true })
      .where(eq(comments.id, id));
  }

  async likeComment(commentId: string): Promise<void> {
    await db.update(comments)
      .set({ likes: sql`${comments.likes} + 1` })
      .where(eq(comments.id, commentId));
  }

  // Posts methods
  async getPosts(): Promise<Post[]> {
    return await db.select().from(posts)
      .orderBy(desc(posts.isPinned), desc(posts.createdAt));
  }

  async getPostsByUser(userId: string): Promise<Post[]> {
    return await db.select().from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  async createPost(post: InsertPost & { userId: string }): Promise<Post> {
    const result = await db.insert(posts).values({
      ...post,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined> {
    const result = await db.update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return result[0];
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }
}

// Export storage instance
export const storage = new PostgreSQLStorage();
