import React, { useState } from "react";
import { Link } from "wouter";
import { Play, Plus, Heart, Star, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimeCardProps } from "@/types";

// Anime card component with hover effects and quick actions
export function AnimeCard({ 
  anime, 
  showProgress = false, 
  progress = 0, 
  onAddToWatchlist, 
  onAddToFavorites, 
  className = "" 
}: AnimeCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false); // Image loading state
  const [isHovered, setIsHovered] = useState(false); // Hover state for interactions

  // Handle watchlist action
  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    onAddToWatchlist?.(anime.id);
  };

  // Handle favorites action
  const handleFavoritesClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    onAddToFavorites?.(anime.id);
  };

  // Get primary genre for display
  const primaryGenre = anime.metadata?.genres?.[0] || "Anime";

  return (
    <div 
      className={`group relative transition-smooth ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`anime-card-${anime.id}`}
    >
      <Link href={`/anime/${anime.id}`}>
        <a className="block">
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-border card-hover transition-smooth cursor-pointer bg-card">
            
            {/* Cover image */}
            {!isImageLoaded && (
              <Skeleton className="w-full h-full" />
            )}
            <img
              src={anime.coverImageUrl || "/placeholder-anime.jpg"}
              alt={`${anime.title} cover`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setIsImageLoaded(true)} // Show even if failed to load
              data-testid="anime-cover-image"
            />

            {/* Rating badge */}
            {anime.rating && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
                  <Star className="w-3 h-3 mr-1" />
                  {anime.rating}
                </Badge>
              </div>
            )}

            {/* Episode count badge */}
            {anime.episodeCount && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
                  <Eye className="w-3 h-3 mr-1" />
                  {anime.episodeCount} ep
                </Badge>
              </div>
            )}

            {/* Progress bar for continue watching */}
            {showProgress && progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/20">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                  data-testid="anime-progress-bar"
                />
              </div>
            )}

            {/* Hover overlay with quick actions */}
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between mb-3">
                  
                  {/* Play button */}
                  <Button
                    size="sm"
                    className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90"
                    data-testid="anime-play-button"
                  >
                    <Play className="w-4 h-4 ml-0.5" />
                  </Button>

                  {/* Quick action buttons */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-10 h-10 rounded-full bg-card/80 hover:bg-card"
                      onClick={handleWatchlistClick}
                      data-testid="anime-watchlist-button"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-10 h-10 rounded-full bg-card/80 hover:bg-card"
                      onClick={handleFavoritesClick}
                      data-testid="anime-favorites-button"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Status indicator for draft anime (admin only) */}
            {anime.status === "draft" && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge variant="destructive" className="text-xs">
                  DRAFT
                </Badge>
              </div>
            )}
          </div>
        </a>
      </Link>

      {/* Anime title and metadata below the card */}
      <div className="mt-3 space-y-1">
        <h3 
          className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-smooth" 
          data-testid="anime-title"
        >
          {anime.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span data-testid="anime-genre">{primaryGenre}</span>
          {anime.year && (
            <span className="flex items-center" data-testid="anime-year">
              <Calendar className="w-3 h-3 mr-1" />
              {anime.year}
            </span>
          )}
        </div>

        {/* Additional metadata row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {anime.episodeCount && (
            <span data-testid="anime-episode-count">
              {anime.episodeCount} episodes
            </span>
          )}
          {anime.metadata?.status && (
            <Badge variant="outline" className="text-xs">
              {anime.metadata.status}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for anime cards
export function AnimeCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`} data-testid="anime-card-skeleton">
      <div className="aspect-[2/3] rounded-lg bg-muted" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

