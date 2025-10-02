import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Play, 
  Plus, 
  Heart, 
  Star, 
  Calendar, 
  Users, 
  Clock,
  Check,
  BookOpen,
  Share2,
  Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { CommentSection } from "@/components/comments/CommentSection";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { animeApi, episodeApi, watchApi, watchlistApi, favoritesApi } from "@/lib/api";
import { Anime, Episode } from "@/types";

// Anime detail page with video player, episodes, and community features
export default function AnimeDetail() {
  const { id } = useParams<{ id: string }>(); // Get anime ID from URL
  const [location, navigate] = useLocation(); // Navigation for episode URLs
  const { user, isAuthenticated } = useAuth(); // Authentication state
  const { toast } = useToast(); // Toast notifications
  const queryClient = useQueryClient(); // Query cache management

  // State for video player and episode selection
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [autoplay, setAutoplay] = useState(false);

  // Fetch anime details
  const { data: animeData, isLoading: isLoadingAnime, error: animeError } = useQuery({
    queryKey: ["/api/anime", id],
    queryFn: () => animeApi.getAnimeById(id!),
    enabled: !!id,
  });

  // Fetch episodes for this anime
  const { data: episodesData, isLoading: isLoadingEpisodes } = useQuery({
    queryKey: ["/api/anime", id, "episodes"],
    queryFn: () => episodeApi.getEpisodes(id!),
    enabled: !!id,
  });

  // Fetch user's watch progress for episodes
  const { data: watchProgressData } = useQuery({
    queryKey: ["/api/users/watch-history"],
    queryFn: () => watchApi.getWatchHistory(),
    enabled: isAuthenticated,
  });

  // Fetch user's watchlist status
  const { data: watchlistData } = useQuery({
    queryKey: ["/api/users/watchlist"],
    queryFn: () => watchlistApi.getWatchlist(),
    enabled: isAuthenticated,
  });

  // Fetch user's favorites status
  const { data: favoritesData } = useQuery({
    queryKey: ["/api/users/favorites"],
    queryFn: () => favoritesApi.getFavorites(),
    enabled: isAuthenticated,
  });

  const anime = animeData?.anime;
  const episodes = episodesData?.episodes || [];
  const watchHistory = watchProgressData?.watchHistory || [];
  const watchlist = watchlistData?.watchlist || [];
  const favorites = favoritesData?.favorites || [];

  // Check if anime is in user's lists
  const isInWatchlist = watchlist.some((item: any) => item.animeId === anime?.id);
  const isInFavorites = favorites.some((item: any) => item.animeId === anime?.id);

  // Set current episode based on URL or default to first episode
  useEffect(() => {
    if (episodes.length > 0 && !currentEpisode) {
      // Check URL for episode parameter
      const urlParams = new URLSearchParams(window.location.search);
      const episodeNumber = urlParams.get('episode');
      
      if (episodeNumber) {
        const targetEpisode = episodes.find(ep => ep.episodeNumber === parseInt(episodeNumber));
        if (targetEpisode) {
          setCurrentEpisode(targetEpisode);
          return;
        }
      }
      
      // Default to first episode
      setCurrentEpisode(episodes[0]);
    }
  }, [episodes, currentEpisode]);

  // Watchlist mutation
  const watchlistMutation = useMutation({
    mutationFn: (isAdding: boolean) => 
      isAdding 
        ? watchlistApi.addToWatchlist(anime!.id)
        : watchlistApi.removeFromWatchlist(anime!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/watchlist"] });
      toast({
        title: isInWatchlist ? "Removed from Watchlist" : "Added to Watchlist",
        description: isInWatchlist 
          ? "Anime removed from your watchlist" 
          : "Anime added to your watchlist",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update watchlist",
        variant: "destructive",
      });
    },
  });

  // Favorites mutation
  const favoritesMutation = useMutation({
    mutationFn: (isAdding: boolean) => 
      isAdding 
        ? favoritesApi.addToFavorites(anime!.id)
        : favoritesApi.removeFromFavorites(anime!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/favorites"] });
      toast({
        title: isInFavorites ? "Removed from Favorites" : "Added to Favorites",
        description: isInFavorites 
          ? "Anime removed from your favorites" 
          : "Anime added to your favorites",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update favorites",
        variant: "destructive",
      });
    },
  });

  // Watch progress mutation
  const progressMutation = useMutation({
    mutationFn: ({ episodeId, progress, completed }: { episodeId: string; progress: number; completed: boolean }) =>
      watchApi.updateProgress(episodeId, progress, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/watch-history"] });
    },
  });

  // Handle episode selection
  const handleEpisodeSelect = (episode: Episode) => {
    setCurrentEpisode(episode);
    // Update URL with episode parameter
    const url = new URL(window.location.href);
    url.searchParams.set('episode', episode.episodeNumber.toString());
    window.history.pushState({}, '', url.toString());
  };

  // Handle next episode
  const handleNextEpisode = () => {
    if (currentEpisode) {
      const currentIndex = episodes.findIndex(ep => ep.id === currentEpisode.id);
      const nextEpisode = episodes[currentIndex + 1];
      if (nextEpisode) {
        handleEpisodeSelect(nextEpisode);
      }
    }
  };

  // Handle watch progress updates
  const handleProgressUpdate = (progress: number, completed: boolean) => {
    if (currentEpisode && isAuthenticated) {
      progressMutation.mutate({
        episodeId: currentEpisode.id,
        progress,
        completed,
      });
    }
  };

  // Handle episode completion
  const handleEpisodeEnd = () => {
    if (currentEpisode) {
      handleProgressUpdate(currentEpisode.duration || 0, true);
      
      // Auto-play next episode if enabled
      if (autoplay) {
        setTimeout(() => {
          handleNextEpisode();
        }, 5000); // 5 second delay for auto-play
      }
    }
  };

  // Get watch progress for an episode
  const getEpisodeProgress = (episodeId: string) => {
    const history = watchHistory.find((h: any) => h.episodeId === episodeId);
    return history ? (history.progress / (currentEpisode?.duration || 1)) * 100 : 0;
  };

  // Handle watchlist toggle
  const handleWatchlistToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add anime to your watchlist",
        variant: "destructive",
      });
      return;
    }
    watchlistMutation.mutate(!isInWatchlist);
  };

  // Handle favorites toggle
  const handleFavoritesToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required", 
        description: "Please sign in to add anime to your favorites",
        variant: "destructive",
      });
      return;
    }
    favoritesMutation.mutate(!isInFavorites);
  };

  // Loading state
  if (isLoadingAnime) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (animeError || !anime) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Anime Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The anime you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/browse")}>
                Browse Anime
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main content - Video player and episodes */}
          <div className="lg:col-span-2">
            
            {/* Video Player */}
            {currentEpisode ? (
              <div className="mb-6">
                <VideoPlayer
                  episode={currentEpisode}
                  anime={anime}
                  onProgressUpdate={handleProgressUpdate}
                  onEpisodeEnd={handleEpisodeEnd}
                  onNextEpisode={episodes.length > 1 ? handleNextEpisode : undefined}
                  initialProgress={getEpisodeProgress(currentEpisode.id)}
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-6">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Episodes Available</h3>
                  <p className="text-muted-foreground">Episodes will be added soon</p>
                </div>
              </div>
            )}

            {/* Episode Information */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2" data-testid="anime-title">
                {anime.title}
              </h1>
              {currentEpisode && (
                <p className="text-lg text-muted-foreground mb-4" data-testid="episode-info">
                  Episode {currentEpisode.episodeNumber}
                  {currentEpisode.title && ` - ${currentEpisode.title}`}
                </p>
              )}
              
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {anime.rating && (
                  <Badge className="bg-primary/90 text-primary-foreground">
                    <Star className="w-4 h-4 mr-1" />
                    {anime.rating}
                  </Badge>
                )}
                {anime.year && (
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {anime.year}
                  </span>
                )}
                {anime.episodeCount && (
                  <span className="text-sm text-muted-foreground">
                    {anime.episodeCount} Episodes
                  </span>
                )}
                {anime.metadata?.studios?.[0]?.name && (
                  <span className="text-sm text-muted-foreground">
                    {anime.metadata.studios[0].name}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleWatchlistToggle}
                  variant={isInWatchlist ? "default" : "outline"}
                  disabled={watchlistMutation.isPending}
                  data-testid="watchlist-button"
                >
                  {isInWatchlist ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                </Button>
                
                <Button
                  onClick={handleFavoritesToggle}
                  variant={isInFavorites ? "default" : "outline"}
                  disabled={favoritesMutation.isPending}
                  data-testid="favorites-button"
                >
                  <Heart className={`w-4 h-4 mr-2 ${isInFavorites ? 'fill-current' : ''}`} />
                  {isInFavorites ? "Favorited" : "Add to Favorites"}
                </Button>
                
                <Button variant="outline" data-testid="share-button">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                
                <Button variant="outline" data-testid="report-button">
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </Button>
              </div>
            </div>

            {/* Episodes List */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Episodes</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Season</span>
                    <Button
                      variant={selectedSeason === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSeason(1)}
                    >
                      1
                    </Button>
                  </div>
                </div>

                {isLoadingEpisodes ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3">
                        <Skeleton className="w-24 h-16 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </div>
                ) : episodes.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No episodes available yet</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-96">
                    <div className="space-y-2">
                      {episodes.map((episode) => {
                        const isActive = currentEpisode?.id === episode.id;
                        const progress = getEpisodeProgress(episode.id);
                        
                        return (
                          <div
                            key={episode.id}
                            className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-smooth ${
                              isActive 
                                ? 'bg-primary/10 border-l-4 border-primary' 
                                : 'hover:bg-muted/20'
                            }`}
                            onClick={() => handleEpisodeSelect(episode)}
                            data-testid={`episode-${episode.episodeNumber}`}
                          >
                            {/* Episode thumbnail */}
                            <div className="w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                              {episode.thumbnailUrl ? (
                                <img
                                  src={episode.thumbnailUrl}
                                  alt={`Episode ${episode.episodeNumber} thumbnail`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              
                              {/* Progress indicator */}
                              {progress > 0 && (
                                <div className="relative mt-[-4px]">
                                  <div className="h-1 bg-muted-foreground/20">
                                    <div 
                                      className="h-full bg-primary" 
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Episode info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-semibold">
                                  {episode.episodeNumber}
                                </span>
                                <h4 className="font-medium truncate">
                                  {episode.title || `Episode ${episode.episodeNumber}`}
                                </h4>
                              </div>
                              {episode.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {episode.description}
                                </p>
                              )}
                            </div>

                            {/* Duration */}
                            <div className="flex-shrink-0 text-sm text-muted-foreground">
                              {episode.duration ? (
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {Math.round(episode.duration / 60)}m
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Anime details and community */}
          <div className="space-y-6">
            
            {/* Anime Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">About This Anime</h3>
                
                {anime.description && (
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {anime.description}
                  </p>
                )}

                {/* Genres */}
                {anime.metadata?.genres && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {anime.metadata.genres.map((genre: string) => (
                        <Badge key={genre} variant="outline">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional metadata */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">
                      {anime.metadata?.status?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>
                  {anime.metadata?.season && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Season</span>
                      <span className="font-medium">
                        {anime.metadata.season} {anime.metadata.seasonYear}
                      </span>
                    </div>
                  )}
                  {anime.metadata?.studios?.[0] && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Studio</span>
                      <span className="font-medium">{anime.metadata.studios[0].name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Community</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Watching</span>
                    <span className="font-semibold">
                      {anime.metadata?.popularity?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Favorites</span>
                    <span className="font-semibold">
                      {anime.metadata?.favourites?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comments Section */}
        <CommentSection animeId={anime.id} className="mt-12" />
      </main>

      <Footer />
    </div>
  );
}
