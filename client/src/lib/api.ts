import { queryClient } from "./queryClient";

// Get authentication token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem("ani3lix_access_token");
};

// Enhanced API request function with authentication and error handling
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Prepare request headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authentication token if available
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make the HTTP request
  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Include cookies for session management
  });

  // Handle authentication errors
  if (response.status === 401) {
    // Token might be expired, clear local storage and redirect to login
    localStorage.removeItem("ani3lix_access_token");
    localStorage.removeItem("ani3lix_refresh_token");
    
    // Clear React Query cache
    queryClient.clear();
    
    // Only redirect if we're not already on the login page
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    
    throw new Error("Authentication required");
  }

  // Handle other HTTP errors
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use the default error message
    }
    
    throw new Error(errorMessage);
  }

  return response;
}

// Specialized API functions for common operations

// Anime-related API calls
export const animeApi = {
  // Get all published anime
  getAnime: () => apiRequest("GET", "/api/anime"),
  
  // Search anime by title
  searchAnime: (query: string) => 
    apiRequest("GET", `/api/anime?search=${encodeURIComponent(query)}`),
  
  // Get anime by ID with episodes
  getAnimeById: (id: string) => apiRequest("GET", `/api/anime/${id}`),
  
  // Get trending anime
  getTrending: () => apiRequest("GET", "/api/anime/trending"),
  
  // Admin: Create new anime
  createAnime: (animeData: any) => apiRequest("POST", "/api/anime", animeData),
  
  // Admin: Update anime
  updateAnime: (id: string, updates: any) => 
    apiRequest("PUT", `/api/anime/${id}`, updates),
  
  // Admin: Publish anime
  publishAnime: (id: string) => 
    apiRequest("PUT", `/api/anime/${id}/publish`),
};

// Episode-related API calls
export const episodeApi = {
  // Get episodes for an anime
  getEpisodes: (animeId: string) => 
    apiRequest("GET", `/api/anime/${animeId}/episodes`),
  
  // Admin: Add new episode
  createEpisode: (animeId: string, episodeData: any) => 
    apiRequest("POST", `/api/anime/${animeId}/episodes`, episodeData),
  
  // Admin: Update episode
  updateEpisode: (id: string, updates: any) => 
    apiRequest("PUT", `/api/episodes/${id}`, updates),
  
  // Admin: Delete episode
  deleteEpisode: (id: string) => apiRequest("DELETE", `/api/episodes/${id}`),
};

// User watch history and progress API calls
export const watchApi = {
  // Get user's watch history
  getWatchHistory: () => apiRequest("GET", "/api/users/watch-history"),
  
  // Get continue watching list
  getContinueWatching: () => apiRequest("GET", "/api/users/continue-watching"),
  
  // Update watch progress for an episode
  updateProgress: (episodeId: string, progress: number, completed: boolean) => 
    apiRequest("POST", "/api/watch-progress", { episodeId, progress, completed }),
};

// Watchlist API calls
export const watchlistApi = {
  // Get user's watchlist
  getWatchlist: () => apiRequest("GET", "/api/users/watchlist"),
  
  // Add anime to watchlist
  addToWatchlist: (animeId: string) => 
    apiRequest("POST", "/api/watchlist", { animeId }),
  
  // Remove anime from watchlist
  removeFromWatchlist: (animeId: string) => 
    apiRequest("DELETE", `/api/watchlist/${animeId}`),
};

// Favorites API calls
export const favoritesApi = {
  // Get user's favorites
  getFavorites: () => apiRequest("GET", "/api/users/favorites"),
  
  // Add anime to favorites
  addToFavorites: (animeId: string) => 
    apiRequest("POST", "/api/favorites", { animeId }),
  
  // Remove anime from favorites
  removeFromFavorites: (animeId: string) => 
    apiRequest("DELETE", `/api/favorites/${animeId}`),
};

// Comments API calls
export const commentsApi = {
  // Get comments for an anime
  getAnimeComments: (animeId: string) => 
    apiRequest("GET", `/api/anime/${animeId}/comments`),
  
  // Get comments for an episode
  getEpisodeComments: (episodeId: string) => 
    apiRequest("GET", `/api/episodes/${episodeId}/comments`),
  
  // Post a new comment
  createComment: (commentData: any) => 
    apiRequest("POST", "/api/comments", commentData),
  
  // Update a comment
  updateComment: (id: string, content: string) => 
    apiRequest("PUT", `/api/comments/${id}`, { content }),
  
  // Delete a comment (moderator/admin only)
  deleteComment: (id: string) => apiRequest("DELETE", `/api/comments/${id}`),
  
  // Like a comment
  likeComment: (id: string) => apiRequest("POST", `/api/comments/${id}/like`),
};

// AniList integration API calls (admin only)
export const anilistApi = {
  // Search anime on AniList
  searchAnime: (query: string, page: number = 1) => 
    apiRequest("GET", `/api/anilist/search?query=${encodeURIComponent(query)}&page=${page}`),
  
  // Get anime details from AniList
  getAnimeById: (anilistId: number) => 
    apiRequest("GET", `/api/anilist/anime/${anilistId}`),
};

// Admin user management API calls
export const adminApi = {
  // Get users by role
  getUsers: (role?: string) => {
    const url = role ? `/api/admin/users?role=${role}` : "/api/admin/users";
    return apiRequest("GET", url);
  },
  
  // Update user role
  updateUserRole: (userId: string, role: string, reason?: string) => 
    apiRequest("PUT", `/api/admin/users/${userId}/role`, { role, reason }),
};

// Utility function to handle API errors in components
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  return "An unexpected error occurred";
};

// Utility function to check if an error is a network error
export const isNetworkError = (error: unknown): boolean => {
  return error instanceof Error && 
         (error.message.includes("fetch") || 
          error.message.includes("network") ||
          error.message.includes("Failed to fetch"));
};

// Utility function to extract error details from API response
export const extractErrorDetails = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.json();
    return errorData.error || errorData.message || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
};
