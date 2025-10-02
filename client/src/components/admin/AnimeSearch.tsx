import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, ExternalLink, Calendar, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { anilistApi } from "@/lib/api";
import { AniListAnime } from "@/types";

interface AnimeSearchProps {
  onSelectAnime: (anime: AniListAnime) => void; // Callback when anime is selected
  className?: string;
}

// Admin component for searching and selecting anime from AniList API
export function AnimeSearch({ onSelectAnime, className = "" }: AnimeSearchProps) {
  const [searchQuery, setSearchQuery] = useState(""); // Search input state
  const [debouncedQuery, setDebouncedQuery] = useState(""); // Debounced query for API calls
  const [currentPage, setCurrentPage] = useState(1); // Pagination state

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search anime on AniList API
  const { 
    data: searchResults, 
    isLoading: isSearching, 
    error: searchError,
    refetch: refetchSearch
  } = useQuery({
    queryKey: ["/api/anilist/search", debouncedQuery, currentPage],
    queryFn: () => anilistApi.searchAnime(debouncedQuery, currentPage),
    enabled: debouncedQuery.trim().length >= 2, // Only search with 2+ characters
    staleTime: 5 * 60 * 1000, // Cache results for 5 minutes
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle anime selection
  const handleSelectAnime = useCallback((anime: AniListAnime) => {
    onSelectAnime(anime);
  }, [onSelectAnime]);

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setCurrentPage(1);
  };

  // Format genres for display
  const formatGenres = (genres: string[]) => {
    return genres.slice(0, 3).join(", ") + (genres.length > 3 ? "..." : "");
  };

  // Format studio name
  const getStudioName = (anime: AniListAnime) => {
    const animationStudio = anime.studios.nodes.find(studio => studio.isAnimationStudio);
    return animationStudio?.name || anime.studios.nodes[0]?.name || "Unknown Studio";
  };

  // Get anime status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "FINISHED":
        return "bg-green-500/20 text-green-400";
      case "RELEASING":
        return "bg-blue-500/20 text-blue-400";
      case "NOT_YET_RELEASED":
        return "bg-yellow-500/20 text-yellow-400";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-muted/20 text-muted-foreground";
    }
  };

  return (
    <div className={`space-y-4 ${className}`} data-testid="anime-search">
      
      {/* Search header */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Search AniList Database</h3>
        <p className="text-sm text-muted-foreground">
          Search for anime from AniList to add to the platform. Results will appear as you type.
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search anime titles (e.g., 'Attack on Titan', 'Demon Slayer')..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-10"
          data-testid="anime-search-input"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            data-testid="clear-search-button"
          >
            ×
          </Button>
        )}
      </div>

      {/* Search status */}
      {debouncedQuery && (
        <div className="text-sm text-muted-foreground">
          {isSearching ? (
            <span>Searching for "{debouncedQuery}"...</span>
          ) : searchResults?.anime?.length ? (
            <span>
              Found {searchResults.pageInfo.total} results for "{debouncedQuery}"
            </span>
          ) : (
            <span>No results found for "{debouncedQuery}"</span>
          )}
        </div>
      )}

      {/* Search results */}
      <ScrollArea className="h-96 border rounded-lg">
        <div className="p-4 space-y-3">
          
          {/* Loading state */}
          {isSearching && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={`search-skeleton-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex space-x-4">
                      <Skeleton className="w-16 h-24 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex space-x-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error state */}
          {searchError && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-destructive mb-4">Failed to search anime</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchError instanceof Error ? searchError.message : "Unknown error occurred"}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => refetchSearch()}
                  data-testid="retry-search-button"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Search results list */}
          {searchResults?.anime && searchResults.anime.length > 0 && (
            <div className="space-y-3">
              {searchResults.anime.map((anime) => (
                <Card 
                  key={anime.id} 
                  className="hover:bg-accent/5 transition-smooth cursor-pointer"
                  onClick={() => handleSelectAnime(anime)}
                  data-testid={`search-result-${anime.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex space-x-4">
                      
                      {/* Anime cover image */}
                      <div className="w-16 h-24 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={anime.coverImage.medium}
                          alt={`${anime.title.romaji} cover`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Anime details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-sm line-clamp-1" data-testid="anime-title">
                              {anime.title.english || anime.title.romaji}
                            </h4>
                            {anime.title.english && anime.title.romaji !== anime.title.english && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {anime.title.romaji}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="ml-2 flex-shrink-0"
                            data-testid={`add-anime-${anime.id}`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>

                        {/* Description */}
                        {anime.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {anime.description.replace(/<[^>]*>/g, '').substring(0, 120)}...
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                          {anime.startDate.year && (
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {anime.startDate.year}
                            </span>
                          )}
                          {anime.episodes && (
                            <span>{anime.episodes} episodes</span>
                          )}
                          {anime.averageScore && (
                            <span className="flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              {anime.averageScore}%
                            </span>
                          )}
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {anime.popularity.toLocaleString()}
                          </span>
                        </div>

                        {/* Tags and status */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`text-xs ${getStatusColor(anime.status)}`}>
                            {anime.status.replace('_', ' ')}
                          </Badge>
                          {anime.genres.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {formatGenres(anime.genres)}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {getStudioName(anime)}
                          </Badge>
                          <a
                            href={`https://anilist.co/anime/${anime.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:text-primary/80 transition-smooth"
                            data-testid={`anilist-link-${anime.id}`}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No results state */}
          {debouncedQuery && !isSearching && (!searchResults?.anime || searchResults.anime.length === 0) && (
            <Card>
              <CardContent className="p-6 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No anime found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or check the spelling.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleClearSearch}
                  data-testid="clear-no-results-button"
                >
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pagination controls */}
          {searchResults?.pageInfo && searchResults.pageInfo.hasNextPage && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={isSearching}
                data-testid="load-more-search-button"
              >
                Load More Results
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Search tips */}
      {!debouncedQuery && (
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Search Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use specific anime titles for better results</li>
              <li>• Try both English and Japanese names</li>
              <li>• Search for popular anime series and movies</li>
              <li>• Results are fetched from AniList's comprehensive database</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

