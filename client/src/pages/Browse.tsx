import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  SortAsc, 
  SortDesc,
  Calendar,
  Star,
  Play,
  TrendingUp,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { animeApi } from "@/lib/api";
import { Anime } from "@/types";

// Browse page with advanced filtering and search functionality
export default function Browse() {
  const [location] = useLocation(); // Get current location for URL params

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Filter states
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number[]>([2000, 2024]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number[]>([0, 10]);
  const [filterQuery, setFilterQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search');
    const filter = urlParams.get('filter');
    const sort = urlParams.get('sort');
    const genre = urlParams.get('genre');

    if (search) {
      setSearchQuery(search);
      setDebouncedQuery(search);
    }

    if (filter) {
      setFilterQuery(filter);
    }

    if (sort) {
      setSortBy(sort);
    }

    if (genre) {
      setSelectedGenres([genre]);
    }
  }, [location]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch anime data
  const { data: animeData, isLoading, error } = useQuery({
    queryKey: ["/api/anime", debouncedQuery, filterQuery],
    queryFn: () => {
      if (debouncedQuery) {
        return animeApi.searchAnime(debouncedQuery);
      } else if (filterQuery === "trending") {
        return animeApi.getTrending();
      } else {
        return animeApi.getAnime();
      }
    },
  });

  const anime = animeData?.anime || [];

  // Define available genres (in real app, these would come from API)
  const availableGenres = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
    "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural",
    "Thriller", "Mecha", "School", "Military", "Music", "Historical"
  ];

  // Define available statuses
  const availableStatuses = [
    "Finished", "Releasing", "Not Yet Released", "Cancelled"
  ];

  // Filter and sort anime
  const filteredAnime = anime.filter((item: Anime) => {
    // Genre filter
    if (selectedGenres.length > 0) {
      const itemGenres = item.metadata?.genres || [];
      const hasSelectedGenre = selectedGenres.some(genre => 
        itemGenres.some((itemGenre: string) => 
          itemGenre.toLowerCase().includes(genre.toLowerCase())
        )
      );
      if (!hasSelectedGenre) return false;
    }

    // Year filter
    if (item.year && (item.year < selectedYear[0] || item.year > selectedYear[1])) {
      return false;
    }

    // Status filter
    if (selectedStatus.length > 0) {
      const itemStatus = item.metadata?.status || "Unknown";
      if (!selectedStatus.some(status => 
        itemStatus.toLowerCase().includes(status.toLowerCase())
      )) {
        return false;
      }
    }

    // Rating filter
    if (item.rating && (item.rating < selectedRating[0] || item.rating > selectedRating[1])) {
      return false;
    }

    return true;
  });

  // Sort anime
  const sortedAnime = [...filteredAnime].sort((a: Anime, b: Anime) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case "year":
        aValue = a.year || 0;
        bValue = b.year || 0;
        break;
      case "rating":
        aValue = a.rating || 0;
        bValue = b.rating || 0;
        break;
      case "episodes":
        aValue = a.episodeCount || 0;
        bValue = b.episodeCount || 0;
        break;
      default:
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Paginate results
  const totalPages = Math.ceil(sortedAnime.length / itemsPerPage);
  const paginatedAnime = sortedAnime.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle filter changes
  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
    setCurrentPage(1);
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedYear([2000, 2024]);
    setSelectedStatus([]);
    setSelectedRating([0, 10]);
    setSearchQuery("");
    setDebouncedQuery("");
    setCurrentPage(1);
  };

  // Get active filter count
  const activeFilterCount = selectedGenres.length + selectedStatus.length + 
    (selectedYear[0] !== 2000 || selectedYear[1] !== 2024 ? 1 : 0) +
    (selectedRating[0] !== 0 || selectedRating[1] !== 10 ? 1 : 0);

  // Filter panel component
  const FilterPanel = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`space-y-6 ${isMobile ? 'p-6' : ''}`}>
      
      {/* Search */}
      <div>
        <h3 className="font-semibold mb-3">Search</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search anime..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
      </div>

      {/* Genres */}
      <div>
        <h3 className="font-semibold mb-3">Genres</h3>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {availableGenres.map((genre) => (
              <div key={genre} className="flex items-center space-x-2">
                <Checkbox
                  id={`genre-${genre}`}
                  checked={selectedGenres.includes(genre)}
                  onCheckedChange={() => handleGenreToggle(genre)}
                  data-testid={`genre-filter-${genre.toLowerCase()}`}
                />
                <label 
                  htmlFor={`genre-${genre}`} 
                  className="text-sm cursor-pointer"
                >
                  {genre}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Release Year */}
      <div>
        <h3 className="font-semibold mb-3">Release Year</h3>
        <div className="px-2">
          <Slider
            value={selectedYear}
            onValueChange={setSelectedYear}
            min={1990}
            max={2024}
            step={1}
            className="mb-2"
            data-testid="year-slider"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{selectedYear[0]}</span>
            <span>{selectedYear[1]}</span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <h3 className="font-semibold mb-3">Status</h3>
        <div className="space-y-2">
          {availableStatuses.map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={selectedStatus.includes(status)}
                onCheckedChange={() => handleStatusToggle(status)}
                data-testid={`status-filter-${status.toLowerCase().replace(' ', '-')}`}
              />
              <label 
                htmlFor={`status-${status}`} 
                className="text-sm cursor-pointer"
              >
                {status}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold mb-3">Rating</h3>
        <div className="px-2">
          <Slider
            value={selectedRating}
            onValueChange={setSelectedRating}
            min={0}
            max={10}
            step={0.5}
            className="mb-2"
            data-testid="rating-slider"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{selectedRating[0]}</span>
            <span>{selectedRating[1]}</span>
          </div>
        </div>
      </div>

      {/* Clear filters */}
      {activeFilterCount > 0 && (
        <Button 
          variant="outline" 
          onClick={clearAllFilters} 
          className="w-full"
          data-testid="clear-filters-button"
        >
          Clear All Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Anime</h1>
          <p className="text-muted-foreground">
            Discover your next favorite anime from our extensive collection
          </p>
        </div>

        <div className="flex gap-8">
          
          {/* Sidebar filters (desktop) */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">{activeFilterCount}</Badge>
                  )}
                </div>
                <FilterPanel />
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="flex-1">
            
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                
                {/* Mobile filter button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden" data-testid="mobile-filter-button">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <FilterPanel isMobile />
                  </SheetContent>
                </Sheet>

                {/* Results count */}
                <span className="text-sm text-muted-foreground">
                  {isLoading ? "Loading..." : `${sortedAnime.length} anime found`}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                
                {/* Sort controls */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40" data-testid="sort-select">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="episodes">Episodes</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  data-testid="sort-order-button"
                >
                  {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>

                {/* View mode toggle */}
                <div className="flex items-center rounded-lg border border-border">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    data-testid="grid-view-button"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    data-testid="list-view-button"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active filters display */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {selectedGenres.map(genre => (
                  <Badge key={genre} variant="secondary" className="cursor-pointer" onClick={() => handleGenreToggle(genre)}>
                    {genre} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {selectedStatus.map(status => (
                  <Badge key={status} variant="secondary" className="cursor-pointer" onClick={() => handleStatusToggle(status)}>
                    {status} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {(selectedYear[0] !== 2000 || selectedYear[1] !== 2024) && (
                  <Badge variant="secondary">
                    {selectedYear[0]}-{selectedYear[1]}
                  </Badge>
                )}
                {(selectedRating[0] !== 0 || selectedRating[1] !== 10) && (
                  <Badge variant="secondary">
                    Rating: {selectedRating[0]}-{selectedRating[1]}
                  </Badge>
                )}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4" : "space-y-4"}>
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className={viewMode === "grid" ? "space-y-2" : "flex space-x-4 p-4"}>
                    <Skeleton className={viewMode === "grid" ? "aspect-[2/3] w-full" : "w-24 h-32"} />
                    {viewMode === "grid" ? (
                      <>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </>
                    ) : (
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {error && (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-medium mb-2">Failed to load anime</h3>
                  <p className="text-muted-foreground mb-4">
                    There was an error loading the anime catalog. Please try again.
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* No results */}
            {!isLoading && !error && sortedAnime.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No anime found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or filters to find what you're looking for.
                  </p>
                  <Button onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Results grid/list */}
            {!isLoading && !error && paginatedAnime.length > 0 && (
              <>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8" data-testid="anime-grid">
                    {paginatedAnime.map((anime: Anime) => (
                      <AnimeCard key={anime.id} anime={anime} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 mb-8" data-testid="anime-list">
                    {paginatedAnime.map((anime: Anime) => (
                      <Card key={anime.id} className="hover:bg-accent/5 transition-smooth">
                        <CardContent className="p-4">
                          <div className="flex space-x-4">
                            <img
                              src={anime.coverImageUrl || "/placeholder.jpg"}
                              alt={anime.title}
                              className="w-24 h-32 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                                {anime.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {anime.description || "No description available."}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                {anime.rating && (
                                  <Badge variant="outline">
                                    <Star className="w-3 h-3 mr-1" />
                                    {anime.rating}
                                  </Badge>
                                )}
                                {anime.year && (
                                  <Badge variant="outline">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {anime.year}
                                  </Badge>
                                )}
                                {anime.episodeCount && (
                                  <Badge variant="outline">
                                    {anime.episodeCount} episodes
                                  </Badge>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm">
                                  <Play className="w-4 h-4 mr-1" />
                                  Watch
                                </Button>
                                <Button size="sm" variant="outline">
                                  Add to List
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      data-testid="prev-page-button"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            data-testid={`page-${page}-button`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="next-page-button"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
