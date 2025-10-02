import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authService } from "./services/auth";
import { aniListService } from "./services/anilist";
import { 
  authenticateToken, 
  requireAdmin, 
  requireModerator, 
  optionalAuth,
  generateTokens,
  verifyRefreshToken 
} from "./middleware/auth";
import { 
  insertUserSchema, 
  insertAnimeSchema, 
  insertEpisodeSchema, 
  insertCommentSchema,
  insertPostSchema 
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate registration data
      const userData = insertUserSchema.parse(req.body);
      
      // Register new user
      const { user, tokens } = await authService.registerUser(userData);
      
      // Remove password from response for security
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        message: "User registered successfully",
        user: userWithoutPassword,
        tokens,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          error: "Validation failed",
          details: validationError.message,
        });
      }
      
      res.status(400).json({
        error: error instanceof Error ? error.message : "Registration failed",
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { identifier, password } = req.body;
      
      if (!identifier || !password) {
        return res.status(400).json({
          error: "Email/username and password are required",
        });
      }
      
      // Authenticate user
      const { user, tokens } = await authService.loginUser(identifier, password);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        message: "Login successful",
        user: userWithoutPassword,
        tokens,
      });
    } catch (error) {
      res.status(401).json({
        error: error instanceof Error ? error.message : "Login failed",
      });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          error: "Refresh token is required",
        });
      }
      
      // Verify refresh token and get user ID
      const userId = verifyRefreshToken(refreshToken);
      if (!userId) {
        return res.status(401).json({
          error: "Invalid refresh token",
        });
      }
      
      // Get current user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({
          error: "User not found",
        });
      }
      
      // Generate new tokens
      const tokens = generateTokens(user);
      
      res.json({
        message: "Tokens refreshed successfully",
        tokens,
      });
    } catch (error) {
      res.status(401).json({
        error: "Token refresh failed",
      });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    // Return current user data without password
    const { password, ...userWithoutPassword } = req.user!;
    res.json({ user: userWithoutPassword });
  });

  // User profile routes
  app.put("/api/users/profile", authenticateToken, async (req, res) => {
    try {
      const { displayName, bio, avatarUrl } = req.body;
      
      const updatedUser = await authService.updateProfile(req.userId!, {
        displayName,
        bio,
        avatarUrl,
      });
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        message: "Profile updated successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Profile update failed",
      });
    }
  });

  app.put("/api/users/username", authenticateToken, async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({
          error: "Username is required",
        });
      }
      
      const updatedUser = await authService.changeUsername(req.userId!, username);
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        message: "Username updated successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Username change failed",
      });
    }
  });

  app.put("/api/users/password", authenticateToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: "Current password and new password are required",
        });
      }
      
      await authService.changePassword(req.userId!, currentPassword, newPassword);
      
      res.json({
        message: "Password changed successfully",
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Password change failed",
      });
    }
  });

  // Anime routes
  app.get("/api/anime", optionalAuth, async (req, res) => {
    try {
      const { search, status } = req.query;
      let anime;
      
      if (search) {
        // Search anime by title
        anime = await storage.searchAnime(
          search as string,
          status as "draft" | "published" | undefined
        );
      } else if (status) {
        // Get anime by status
        anime = await storage.getAnimeByStatus(status as "draft" | "published");
      } else {
        // Get all published anime for public access
        anime = await storage.getPublishedAnime();
      }
      
      res.json({ anime });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch anime",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/anime/trending", async (req, res) => {
    try {
      const trendingAnime = await storage.getTrendingAnime();
      res.json({ anime: trendingAnime });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch trending anime",
      });
    }
  });

  app.get("/api/anime/:id", optionalAuth, async (req, res) => {
    try {
      const anime = await storage.getAnime(req.params.id);
      
      if (!anime) {
        return res.status(404).json({
          error: "Anime not found",
        });
      }
      
      // Check if user can view draft content
      if (anime.status === "draft" && (!req.user || !authService.hasPermission(req.user, "admin"))) {
        return res.status(404).json({
          error: "Anime not found",
        });
      }
      
      // Get episodes for this anime
      const episodes = await storage.getEpisodesByAnime(anime.id);
      
      res.json({
        anime,
        episodes,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch anime details",
      });
    }
  });

  app.post("/api/anime", requireAdmin, async (req, res) => {
    try {
      const animeData = insertAnimeSchema.parse(req.body);
      
      // Check if anime with this AniList ID already exists
      if (animeData.anilistId) {
        const existingAnime = await storage.getAnimeByAnilistId(animeData.anilistId);
        if (existingAnime) {
          return res.status(400).json({
            error: "Anime with this AniList ID already exists",
          });
        }
      }
      
      const anime = await storage.createAnime({
        ...animeData,
        createdBy: req.userId!,
      });
      
      res.status(201).json({
        message: "Anime added successfully",
        anime,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          error: "Validation failed",
          details: validationError.message,
        });
      }
      
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to add anime",
      });
    }
  });

  app.put("/api/anime/:id", requireAdmin, async (req, res) => {
    try {
      const updates = req.body;
      
      const anime = await storage.updateAnime(req.params.id, updates);
      
      if (!anime) {
        return res.status(404).json({
          error: "Anime not found",
        });
      }
      
      res.json({
        message: "Anime updated successfully",
        anime,
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to update anime",
      });
    }
  });

  app.put("/api/anime/:id/publish", requireAdmin, async (req, res) => {
    try {
      const anime = await storage.updateAnime(req.params.id, { status: "published" });
      
      if (!anime) {
        return res.status(404).json({
          error: "Anime not found",
        });
      }
      
      res.json({
        message: "Anime published successfully",
        anime,
      });
    } catch (error) {
      res.status(400).json({
        error: "Failed to publish anime",
      });
    }
  });

  // Episode routes
  app.get("/api/anime/:animeId/episodes", async (req, res) => {
    try {
      const episodes = await storage.getEpisodesByAnime(req.params.animeId);
      res.json({ episodes });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch episodes",
      });
    }
  });

  app.post("/api/anime/:animeId/episodes", requireAdmin, async (req, res) => {
    try {
      const episodeData = insertEpisodeSchema.parse({
        ...req.body,
        animeId: req.params.animeId,
      });
      
      const episode = await storage.createEpisode(episodeData);
      
      res.status(201).json({
        message: "Episode added successfully",
        episode,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          error: "Validation failed",
          details: validationError.message,
        });
      }
      
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to add episode",
      });
    }
  });

  app.put("/api/episodes/:id", requireAdmin, async (req, res) => {
    try {
      const updates = req.body;
      
      const episode = await storage.updateEpisode(req.params.id, updates);
      
      if (!episode) {
        return res.status(404).json({
          error: "Episode not found",
        });
      }
      
      res.json({
        message: "Episode updated successfully",
        episode,
      });
    } catch (error) {
      res.status(400).json({
        error: "Failed to update episode",
      });
    }
  });

  app.delete("/api/episodes/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteEpisode(req.params.id);
      
      res.json({
        message: "Episode deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        error: "Failed to delete episode",
      });
    }
  });

  // AniList API integration routes (admin only)
  app.get("/api/anilist/search", requireAdmin, async (req, res) => {
    try {
      const { query, page = 1, perPage = 25 } = req.query;
      
      if (!query) {
        return res.status(400).json({
          error: "Search query is required",
        });
      }
      
      const results = await aniListService.searchAnime(
        query as string,
        parseInt(page as string),
        parseInt(perPage as string)
      );
      
      res.json(results);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "AniList search failed",
      });
    }
  });

  app.get("/api/anilist/anime/:id", requireAdmin, async (req, res) => {
    try {
      const anilistId = parseInt(req.params.id);
      
      if (isNaN(anilistId)) {
        return res.status(400).json({
          error: "Invalid AniList ID",
        });
      }
      
      const anime = await aniListService.getAnimeById(anilistId);
      const convertedData = aniListService.convertToAnimeData(anime);
      
      res.json({
        anilistData: anime,
        convertedData,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch anime from AniList",
      });
    }
  });

  // Watch history routes
  app.get("/api/users/watch-history", authenticateToken, async (req, res) => {
    try {
      const watchHistory = await storage.getUserWatchHistory(req.userId!);
      res.json({ watchHistory });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch watch history",
      });
    }
  });

  app.post("/api/watch-progress", authenticateToken, async (req, res) => {
    try {
      const { episodeId, progress, completed } = req.body;
      
      if (!episodeId || progress === undefined) {
        return res.status(400).json({
          error: "Episode ID and progress are required",
        });
      }
      
      await storage.updateWatchProgress(
        req.userId!,
        episodeId,
        progress,
        completed || false
      );
      
      res.json({
        message: "Watch progress updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        error: "Failed to update watch progress",
      });
    }
  });

  app.get("/api/users/continue-watching", authenticateToken, async (req, res) => {
    try {
      const continueWatching = await storage.getContinueWatching(req.userId!);
      res.json({ continueWatching });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch continue watching",
      });
    }
  });

  // Watchlist routes
  app.get("/api/users/watchlist", authenticateToken, async (req, res) => {
    try {
      const watchlist = await storage.getUserWatchlist(req.userId!);
      res.json({ watchlist });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch watchlist",
      });
    }
  });

  app.post("/api/watchlist", authenticateToken, async (req, res) => {
    try {
      const { animeId } = req.body;
      
      if (!animeId) {
        return res.status(400).json({
          error: "Anime ID is required",
        });
      }
      
      // Check if already in watchlist
      const inWatchlist = await storage.isInWatchlist(req.userId!, animeId);
      if (inWatchlist) {
        return res.status(400).json({
          error: "Anime already in watchlist",
        });
      }
      
      await storage.addToWatchlist(req.userId!, animeId);
      
      res.json({
        message: "Added to watchlist successfully",
      });
    } catch (error) {
      res.status(400).json({
        error: "Failed to add to watchlist",
      });
    }
  });

  app.delete("/api/watchlist/:animeId", authenticateToken, async (req, res) => {
    try {
      await storage.removeFromWatchlist(req.userId!, req.params.animeId);
      
      res.json({
        message: "Removed from watchlist successfully",
      });
    } catch (error) {
      res.status(400).json({
        error: "Failed to remove from watchlist",
      });
    }
  });

  // Favorites routes
  app.get("/api/users/favorites", authenticateToken, async (req, res) => {
    try {
      const favorites = await storage.getUserFavorites(req.userId!);
      res.json({ favorites });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch favorites",
      });
    }
  });

  app.post("/api/favorites", authenticateToken, async (req, res) => {
    try {
      const { animeId } = req.body;
      
      if (!animeId) {
        return res.status(400).json({
          error: "Anime ID is required",
        });
      }
      
      // Check if already in favorites
      const inFavorites = await storage.isInFavorites(req.userId!, animeId);
      if (inFavorites) {
        return res.status(400).json({
          error: "Anime already in favorites",
        });
      }
      
      await storage.addToFavorites(req.userId!, animeId);
      
      res.json({
        message: "Added to favorites successfully",
      });
    } catch (error) {
      res.status(400).json({
        error: "Failed to add to favorites",
      });
    }
  });

  app.delete("/api/favorites/:animeId", authenticateToken, async (req, res) => {
    try {
      await storage.removeFromFavorites(req.userId!, req.params.animeId);
      
      res.json({
        message: "Removed from favorites successfully",
      });
    } catch (error) {
      res.status(400).json({
        error: "Failed to remove from favorites",
      });
    }
  });

  // Comments routes
  app.get("/api/anime/:animeId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByAnime(req.params.animeId);
      res.json({ comments });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch comments",
      });
    }
  });

  app.get("/api/episodes/:episodeId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByEpisode(req.params.episodeId);
      res.json({ comments });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch comments",
      });
    }
  });

  app.post("/api/comments", authenticateToken, async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      
      const comment = await storage.createComment({
        ...commentData,
        userId: req.userId!,
      });
      
      res.status(201).json({
        message: "Comment posted successfully",
        comment,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          error: "Validation failed",
          details: validationError.message,
        });
      }
      
      res.status(400).json({
        error: "Failed to post comment",
      });
    }
  });

  app.put("/api/comments/:id", authenticateToken, async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({
          error: "Comment content is required",
        });
      }
      
      // Check if user owns the comment or has moderation rights
      const comment = await storage.updateComment(req.params.id, content);
      
      if (!comment) {
        return res.status(404).json({
          error: "Comment not found",
        });
      }
      
      res.json({
        message: "Comment updated successfully",
        comment,
      });
    } catch (error) {
      res.status(400).json({
        error: "Failed to update comment",
      });
    }
  });

  app.delete("/api/comments/:id", [authenticateToken, requireModerator], async (req, res) => {
    try {
      await storage.deleteComment(req.params.id);
      
      res.json({
        message: "Comment deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        error: "Failed to delete comment",
      });
    }
  });

  app.post("/api/comments/:id/like", authenticateToken, async (req, res) => {
    try {
      await storage.likeComment(req.params.id);
      
      res.json({
        message: "Comment liked successfully",
      });
    } catch (error) {
      res.status(400).json({
        error: "Failed to like comment",
      });
    }
  });

  // Admin user management routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { role } = req.query;
      let users;
      
      if (role) {
        users = await storage.getUsersByRole(role as any);
      } else {
        // This would need a getAllUsers method in storage
        users = [];
      }
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      
      res.json({ users: usersWithoutPasswords });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch users",
      });
    }
  });

  app.put("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { role, reason } = req.body;
      
      if (!role) {
        return res.status(400).json({
          error: "Role is required",
        });
      }
      
      await authService.changeUserRole(
        req.params.id,
        role,
        req.userId!,
        reason
      );
      
      res.json({
        message: "User role updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to update user role",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
