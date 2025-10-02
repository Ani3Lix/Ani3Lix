// Type definitions for the Ani3Lix application
export interface User {
  id: string; // Immutable UUID for user identification
  username: string; // User's changeable username
  email: string; // User's email address
  displayName?: string; // Display name for profile
  bio?: string; // User biography
  avatarUrl?: string; // Avatar image URL
  role: "user" | "moderator" | "admin" | "site_owner"; // User role for access control
  createdAt: string; // Account creation timestamp
  updatedAt: string; // Last update timestamp
  lastUsernameChange?: string; // Last username change for weekly restriction
}

// Anime metadata interface from database
export interface Anime {
  id: string; // Internal anime ID
  anilistId?: number; // AniList API reference ID
  title: string; // Anime title
  description?: string; // Synopsis and description
  coverImageUrl?: string; // Cover/poster image URL
  bannerImageUrl?: string; // Banner image for hero sections
  status: "draft" | "published"; // Admin workflow status
  metadata?: any; // Flexible JSON metadata from AniList
  rating?: number; // Average rating score
  episodeCount?: number; // Total number of episodes
  year?: number; // Release year
  createdBy?: string; // Admin who added this anime
  createdAt: string; // Creation timestamp
  updatedAt: string; // Last update timestamp
}

// Episode interface with external video URLs
export interface Episode {
  id: string; // Episode unique identifier
  animeId: string; // Parent anime reference
  episodeNumber: number; // Episode sequence number
  title?: string; // Episode title
  description?: string; // Episode description
  thumbnailUrl?: string; // Episode thumbnail image
  videoUrl: string; // External video stream URL
  duration?: number; // Episode duration in seconds
  introStart?: number; // Intro start timestamp in seconds for skip functionality
  introEnd?: number; // Intro end timestamp in seconds for skip functionality
  outroStart?: number; // Outro start timestamp in seconds for skip functionality
  createdAt: string; // Creation timestamp
  updatedAt: string; // Last update timestamp
}

// Watch history with progress tracking
export interface WatchHistory {
  id: string; // Watch session identifier
  userId: string; // User who watched
  animeId: string; // Anime being watched
  episodeId: string; // Specific episode
  progress: number; // Watch progress in seconds
  completed: boolean; // Whether episode was fully watched
  watchedAt: string; // Watch session timestamp
}

// Watchlist entry interface
export interface Watchlist {
  id: string; // Watchlist entry identifier
  userId: string; // User who added to watchlist
  animeId: string; // Anime in watchlist
  addedAt: string; // When anime was added
}

// Favorites entry interface
export interface Favorite {
  id: string; // Favorite entry identifier
  userId: string; // User who favorited
  animeId: string; // Favorited anime
  addedAt: string; // When anime was favorited
}

// Comment interface with nested replies support
export interface Comment {
  id: string; // Comment unique identifier
  userId: string; // Comment author
  animeId?: string; // Anime being commented on
  episodeId?: string; // Specific episode if applicable
  parentCommentId?: string; // For nested replies
  content: string; // Comment text content
  likes: number; // Number of likes
  isDeleted: boolean; // Soft deletion flag
  createdAt: string; // Comment creation time
  updatedAt: string; // Last edit time
  user?: User; // Populated user data
  replies?: Comment[]; // Nested replies
}

// Post interface for community discussions
export interface Post {
  id: string; // Post unique identifier
  userId: string; // Post author
  title: string; // Post title
  content: string; // Post content/body
  type: "discussion" | "announcement" | "review"; // Post category
  isPinned: boolean; // Admin pinning status
  likes: number; // Post engagement metric
  createdAt: string; // Post creation time
  updatedAt: string; // Last edit time
  user?: User; // Populated user data
}

// AniList API response interfaces
export interface AniListAnime {
  id: number; // AniList ID
  title: {
    romaji: string; // Romanized title
    english?: string; // English title
    native: string; // Native title
  };
  description?: string; // Anime synopsis
  coverImage: {
    extraLarge: string; // High res cover
    large: string; // Standard cover
    medium: string; // Thumbnail cover
  };
  bannerImage?: string; // Banner image
  genres: string[]; // Genre array
  episodes?: number; // Episode count
  startDate: {
    year?: number;
    month?: number;
    day?: number;
  };
  endDate: {
    year?: number;
    month?: number;
    day?: number;
  };
  season?: string; // Anime season
  seasonYear?: number; // Season year
  status: string; // Release status
  studios: {
    nodes: Array<{
      name: string; // Studio name
      isAnimationStudio: boolean;
    }>;
  };
  averageScore?: number; // Score out of 100
  popularity: number; // Popularity ranking
  favourites: number; // Number of favorites
}

// API response interfaces
export interface ApiResponse<T> {
  data?: T; // Response data
  error?: string; // Error message
  message?: string; // Success message
}

export interface PaginatedResponse<T> {
  data: T[]; // Array of items
  total: number; // Total item count
  page: number; // Current page
  limit: number; // Items per page
  hasNext: boolean; // Has next page
  hasPrev: boolean; // Has previous page
}

// Authentication interfaces
export interface LoginCredentials {
  identifier: string; // Email or username
  password: string; // User password
}

export interface RegisterData {
  username: string; // Chosen username
  email: string; // Email address
  password: string; // Password
  displayName?: string; // Optional display name
}

export interface AuthResponse {
  user: User; // User data
  tokens: {
    accessToken: string; // JWT access token
    refreshToken: string; // Refresh token
  };
}

// Form interfaces for components
export interface ProfileUpdateData {
  displayName?: string; // Updated display name
  bio?: string; // Updated biography
  avatarUrl?: string; // Updated avatar URL
}

export interface CommentFormData {
  content: string; // Comment text
  animeId?: string; // Target anime
  episodeId?: string; // Target episode
  parentCommentId?: string; // Parent for replies
}

export interface AnimeFormData {
  title: string; // Anime title
  description?: string; // Synopsis
  anilistId?: number; // AniList reference
  coverImageUrl?: string; // Cover image
  bannerImageUrl?: string; // Banner image
  rating?: number; // Rating score
  episodeCount?: number; // Episode count
  year?: number; // Release year
  metadata?: any; // Additional metadata
}

export interface EpisodeFormData {
  episodeNumber: number; // Episode sequence
  title?: string; // Episode title
  description?: string; // Episode description
  videoUrl: string; // Video stream URL
  thumbnailUrl?: string; // Thumbnail image
  duration?: number; // Duration in seconds
}

// Video player interfaces
export interface VideoPlayerProps {
  episode: Episode; // Current episode
  anime: Anime; // Parent anime
  onProgressUpdate?: (progress: number, completed: boolean) => void; // Progress callback
  onEpisodeEnd?: () => void; // Episode completion callback
  onNextEpisode?: () => void; // Next episode callback
  initialProgress?: number; // Starting progress
}

export interface PlayerState {
  isPlaying: boolean; // Playback state
  currentTime: number; // Current position
  duration: number; // Total duration
  volume: number; // Volume level
  isMuted: boolean; // Mute state
  isFullscreen: boolean; // Fullscreen state
  quality: string; // Video quality
  playbackRate: number; // Playback speed
  showControls: boolean; // Controls visibility
}

// Component prop interfaces
export interface AnimeCardProps {
  anime: Anime; // Anime data
  showProgress?: boolean; // Show watch progress
  progress?: number; // Watch progress percentage
  onAddToWatchlist?: (animeId: string) => void; // Watchlist callback
  onAddToFavorites?: (animeId: string) => void; // Favorites callback
  className?: string; // Additional CSS classes
}

export interface AnimeGridProps {
  anime: Anime[]; // Array of anime
  isLoading?: boolean; // Loading state
  title?: string; // Grid section title
  showViewAll?: boolean; // Show "View All" link
  viewAllHref?: string; // "View All" link URL
  className?: string; // Additional CSS classes
}

export interface NavigationProps {
  user?: User | null; // Current user data
  onLogout?: () => void; // Logout callback
}

// Search and filter interfaces
export interface SearchFilters {
  query?: string; // Search query
  genre?: string; // Genre filter
  year?: number; // Year filter
  status?: string; // Status filter
  sort?: "popularity" | "rating" | "title" | "year"; // Sort option
}

export interface SearchResults {
  anime: Anime[]; // Search results
  total: number; // Total results
  hasMore: boolean; // More results available
}

// Admin panel interfaces
export interface AdminStats {
  totalAnime: number; // Total anime count
  totalUsers: number; // Total user count
  totalEpisodes: number; // Total episode count
  recentActivity: AdminActivity[]; // Recent admin actions
}

export interface AdminActivity {
  id: string; // Activity ID
  type: "anime_added" | "anime_published" | "episode_added" | "user_promoted"; // Activity type
  description: string; // Activity description
  userId: string; // User who performed action
  timestamp: string; // When action occurred
  metadata?: any; // Additional activity data
}

// Error interfaces
export interface AppError {
  message: string; // Error message
  code?: string; // Error code
  details?: any; // Additional error details
}

export interface ValidationError {
  field: string; // Field with error
  message: string; // Error message
}

// Utility type for component children
export interface ChildrenProps {
  children: React.ReactNode;
}

// Hook return types
export interface UseAnimeReturn {
  anime: Anime[]; // Anime data
  isLoading: boolean; // Loading state
  error: Error | null; // Error state
  refetch: () => void; // Refetch function
}

export interface UseAuthReturn {
  user: User | null; // Current user
  isLoading: boolean; // Auth check loading
  isAuthenticated: boolean; // Auth status
  login: (credentials: LoginCredentials) => Promise<void>; // Login function
  register: (data: RegisterData) => Promise<void>; // Register function
  logout: () => void; // Logout function
  hasRole: (role: string) => boolean; // Role check function
}

