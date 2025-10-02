import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Play, TrendingUp, Star, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { AnimeGrid, TrendingAnimeGrid, ContinueWatchingGrid } from "@/components/anime/AnimeGrid";
import { useAuth } from "@/hooks/useAuth";
import { animeApi, watchApi } from "@/lib/api";

// Home page component with hero section and anime collections
export default function Home() {
  const { isAuthenticated } = useAuth(); // Authentication state

  // Fetch trending anime for hero and trending sections
  const { data: trendingData, isLoading: isLoadingTrending } = useQuery({
    queryKey: ["/api/anime/trending"],
    queryFn: () => animeApi.getTrending(),
  });

  // Fetch all published anime for general sections
  const { data: animeData, isLoading: isLoadingAnime } = useQuery({
    queryKey: ["/api/anime"],
    queryFn: () => animeApi.getAnime(),
  });

  // Fetch continue watching for authenticated users
  const { data: continueWatchingData, isLoading: isLoadingContinueWatching } = useQuery({
    queryKey: ["/api/users/continue-watching"],
    queryFn: () => watchApi.getContinueWatching(),
    enabled: isAuthenticated, // Only fetch if logged in
  });

  // Get featured anime for hero section (first from trending)
  const featuredAnime = trendingData?.anime?.[0];
  const trendingAnime = trendingData?.anime?.slice(0, 12) || [];
  const continueWatching = continueWatchingData?.continueWatching || [];
  const recentlyAdded = animeData?.anime?.slice(0, 12) || [];

  // Format genre list for display
  const formatGenres = (genres: string[]) => {
    return genres?.slice(0, 3).join(", ") || "Anime";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section with Featured Anime */}
      <section className="relative h-[600px] overflow-hidden" data-testid="hero-section">
        {isLoadingTrending ? (
          // Hero skeleton
          <div className="relative h-full bg-muted animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
              <div className="max-w-2xl space-y-4">
                <Skeleton className="h-16 w-3/4" />
                <div className="flex space-x-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-24 w-full" />
                <div className="flex space-x-4">
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-40" />
                </div>
              </div>
            </div>
          </div>
        ) : featuredAnime ? (
          <>
            {/* Background image with overlays */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${featuredAnime.bannerImageUrl || featuredAnime.coverImageUrl})`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            
            {/* Featured anime content */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
              <div className="max-w-2xl">
                
                {/* Anime title */}
                <h1 className="text-5xl md:text-6xl font-bold mb-4" data-testid="featured-anime-title">
                  {featuredAnime.title}
                </h1>
                
                {/* Metadata badges */}
                <div className="flex items-center space-x-4 mb-6">
                  {featuredAnime.rating && (
                    <Badge className="bg-primary/90 text-primary-foreground">
                      <Star className="w-4 h-4 mr-1" />
                      {featuredAnime.rating}
                    </Badge>
                  )}
                  {featuredAnime.episodeCount && (
                    <span className="text-sm text-muted-foreground">
                      {featuredAnime.episodeCount} Episodes
                    </span>
                  )}
                  {featuredAnime.year && (
                    <span className="text-sm text-muted-foreground">
                      {featuredAnime.year}
                    </span>
                  )}
                  {featuredAnime.status === "published" && (
                    <Badge variant="outline">Available</Badge>
                  )}
                </div>
                
                {/* Description */}
                <p className="text-lg text-foreground/90 mb-8 line-clamp-3">
                  {featuredAnime.description || "Discover this amazing anime series with compelling characters and an engaging storyline that will keep you entertained."}
                </p>
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-4">
                  <Link href={`/anime/${featuredAnime.id}`}>
                    <Button size="lg" className="bg-primary hover:bg-primary/90" data-testid="watch-now-button">
                      <Play className="w-5 h-5 mr-2" />
                      Watch Now
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-card/80 hover:bg-card border-border"
                    data-testid="add-to-watchlist-button"
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Add to Watchlist
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-card/80 hover:bg-card border-border"
                    data-testid="favorite-button"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    Favorite
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Fallback hero when no featured anime
          <div className="relative h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-4">Welcome to Ani3Lix</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Your ultimate destination for anime streaming
              </p>
              <Link href="/browse">
                <Button size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  Start Watching
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Main content sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Continue Watching Section (authenticated users only) */}
        {isAuthenticated && (
          <ContinueWatchingGrid 
            anime={continueWatching}
            isLoading={isLoadingContinueWatching}
          />
        )}

        {/* Trending Anime Section */}
        <TrendingAnimeGrid 
          anime={trendingAnime}
          isLoading={isLoadingTrending}
        />

        {/* Recently Added Section */}
        <AnimeGrid
          anime={recentlyAdded}
          isLoading={isLoadingAnime}
          title="Recently Added"
          showViewAll={true}
          viewAllHref="/browse?sort=newest"
          className="mb-12"
        />

        {/* Popular This Season */}
        <AnimeGrid
          anime={trendingAnime.slice(0, 6)}
          isLoading={isLoadingTrending}
          title="Popular This Season"
          showViewAll={true}
          viewAllHref="/browse?filter=season"
          className="mb-12"
        />

        {/* Stats Section */}
        <section className="grid md:grid-cols-3 gap-8 py-12 border-t border-border">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">10,000+</h3>
            <p className="text-muted-foreground">Episodes Available</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">500+</h3>
            <p className="text-muted-foreground">Anime Series</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-2">100K+</h3>
            <p className="text-muted-foreground">Active Users</p>
          </div>
        </section>

        {/* Call to action for non-authenticated users */}
        {!isAuthenticated && (
          <section className="text-center py-16 border-t border-border">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Watching?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of anime fans and discover your next favorite series. Create your account to track your progress, build watchlists, and connect with the community.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/browse">
                  <Button size="lg" variant="outline">
                    Browse Anime
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
