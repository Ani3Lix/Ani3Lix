import React from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { AnimeCard, AnimeCardSkeleton } from "./AnimeCard";
import { AnimeGridProps } from "@/types";

// Grid component for displaying anime collections with optional title and view all link
export function AnimeGrid({ 
  anime, 
  isLoading = false, 
  title, 
  showViewAll = false, 
  viewAllHref = "/browse", 
  className = "" 
}: AnimeGridProps) {

  // Show skeleton loaders while data is loading
  if (isLoading) {
    return (
      <section className={`${className}`} data-testid="anime-grid-loading">
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{title}</h2>
            <div className="w-16 h-6 bg-muted rounded animate-pulse" />
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <AnimeCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </section>
    );
  }

  // Show empty state if no anime provided
  if (!anime || anime.length === 0) {
    return (
      <section className={`${className}`} data-testid="anime-grid-empty">
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
        )}
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-muted-foreground" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 4V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V4M7 4H17M7 4L5 6M17 4L19 6M5 6V20C5 21.1046 5.89543 22 7 22H17C17.1046 22 18 21.1046 18 20V6M5 6H19"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No anime found</h3>
          <p className="text-muted-foreground">
            {title ? `No ${title.toLowerCase()} available at the moment.` : "No anime to display."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={`${className}`} data-testid="anime-grid">
      
      {/* Section header with title and optional view all link */}
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" data-testid="anime-grid-title">
            {title}
          </h2>
          {showViewAll && (
            <Link href={viewAllHref}>
              <a 
                className="text-sm text-primary hover:text-primary/80 transition-smooth flex items-center group"
                data-testid="anime-grid-view-all"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </a>
            </Link>
          )}
        </div>
      )}

      {/* Responsive anime grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {anime.map((animeItem) => (
          <AnimeCard
            key={animeItem.id}
            anime={animeItem}
            data-testid={`anime-grid-item-${animeItem.id}`}
          />
        ))}
      </div>

      {/* Show additional load more hint for large collections */}
      {anime.length >= 12 && showViewAll && (
        <div className="text-center mt-8">
          <Link href={viewAllHref}>
            <a 
              className="inline-flex items-center px-6 py-3 bg-card hover:bg-card/80 border border-border rounded-lg transition-smooth"
              data-testid="anime-grid-load-more"
            >
              Browse All {title}
              <ChevronRight className="w-4 h-4 ml-2" />
            </a>
          </Link>
        </div>
      )}
    </section>
  );
}

// Specialized grid components for different content types

// Trending anime grid with special styling
export function TrendingAnimeGrid({ anime, isLoading }: { anime: any[]; isLoading?: boolean }) {
  return (
    <AnimeGrid
      anime={anime}
      isLoading={isLoading}
      title="Trending Now"
      showViewAll={true}
      viewAllHref="/browse?filter=trending"
      className="mb-12"
    />
  );
}

// Continue watching grid for authenticated users
export function ContinueWatchingGrid({ 
  anime, 
  isLoading, 
  watchProgress 
}: { 
  anime: any[]; 
  isLoading?: boolean; 
  watchProgress?: Record<string, number>; 
}) {
  return (
    <section className="mb-12" data-testid="continue-watching-grid">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Continue Watching</h2>
        <Link href="/profile?tab=history">
          <a className="text-sm text-primary hover:text-primary/80 transition-smooth flex items-center">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <AnimeCardSkeleton key={`continue-skeleton-${index}`} />
          ))}
        </div>
      ) : anime.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No anime in progress</p>
          <Link href="/browse">
            <a className="text-primary hover:text-primary/80 transition-smooth">
              Start watching something new
            </a>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {anime.map((animeItem) => (
            <AnimeCard
              key={animeItem.id}
              anime={animeItem}
              showProgress={true}
              progress={watchProgress?.[animeItem.id] || 0}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Recently added anime grid for admin/moderators
export function RecentlyAddedGrid({ anime, isLoading }: { anime: any[]; isLoading?: boolean }) {
  return (
    <AnimeGrid
      anime={anime}
      isLoading={isLoading}
      title="Recently Added"
      showViewAll={true}
      viewAllHref="/browse?sort=newest"
      className="mb-12"
    />
  );
}

// Watchlist grid for user profile
export function WatchlistGrid({ anime, isLoading }: { anime: any[]; isLoading?: boolean }) {
  return (
    <AnimeGrid
      anime={anime}
      isLoading={isLoading}
      title="My Watchlist"
      className="mb-12"
    />
  );
}

// Favorites grid for user profile
export function FavoritesGrid({ anime, isLoading }: { anime: any[]; isLoading?: boolean }) {
  return (
    <AnimeGrid
      anime={anime}
      isLoading={isLoading}
      title="My Favorites"
      className="mb-12"
    />
  );
}

