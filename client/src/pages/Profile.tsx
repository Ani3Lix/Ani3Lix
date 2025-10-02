import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  User, 
  Settings, 
  Camera, 
  Calendar, 
  Clock, 
  Play, 
  Heart, 
  Bookmark,
  BarChart3,
  Trophy,
  Users,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { useAuth } from "@/hooks/useAuth";
import { watchApi, watchlistApi, favoritesApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

// User profile page with statistics, watch history, and preferences
export default function Profile() {
  const { user, isAuthenticated } = useAuth(); // Authentication context
  const [activeTab, setActiveTab] = useState("history"); // Active tab state

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to view your profile.
              </p>
              <Button>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch user's watch history
  const { data: watchHistoryData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/users/watch-history"],
    queryFn: () => watchApi.getWatchHistory(),
  });

  // Fetch user's continue watching
  const { data: continueWatchingData, isLoading: isLoadingContinue } = useQuery({
    queryKey: ["/api/users/continue-watching"], 
    queryFn: () => watchApi.getContinueWatching(),
  });

  // Fetch user's watchlist
  const { data: watchlistData, isLoading: isLoadingWatchlist } = useQuery({
    queryKey: ["/api/users/watchlist"],
    queryFn: () => watchlistApi.getWatchlist(),
  });

  // Fetch user's favorites
  const { data: favoritesData, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ["/api/users/favorites"],
    queryFn: () => favoritesApi.getFavorites(),
  });

  const watchHistory = watchHistoryData?.watchHistory || [];
  const continueWatching = continueWatchingData?.continueWatching || [];
  const watchlist = watchlistData?.watchlist || [];
  const favorites = favoritesData?.favorites || [];

  // Calculate user statistics
  const stats = {
    totalWatched: watchHistory.filter((h: any) => h.completed).length,
    totalWatchTime: watchHistory.reduce((acc: number, h: any) => acc + (h.progress || 0), 0),
    watchlistCount: watchlist.length,
    favoritesCount: favorites.length,
    currentlyWatching: continueWatching.length,
  };

  // Format watch time in hours
  const formatWatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (user.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user.username.charAt(0).toUpperCase();
  };

  // Calculate days until username change is available
  const getDaysUntilUsernameChange = () => {
    if (!user.lastUsernameChange) return 0;
    
    const lastChange = new Date(user.lastUsernameChange);
    const oneWeekLater = new Date(lastChange.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    if (now >= oneWeekLater) return 0;
    
    return Math.ceil((oneWeekLater.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Profile sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                
                {/* Profile header */}
                <div className="text-center mb-6">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-32 h-32 ring-4 ring-primary">
                      <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />
                      <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 w-10 h-10 rounded-full"
                      data-testid="change-avatar-button"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-1" data-testid="profile-display-name">
                    {user.displayName || user.username}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3" data-testid="profile-username">
                    @{user.username}
                  </p>
                  <Badge variant="secondary" data-testid="profile-role">
                    {user.role}
                  </Badge>
                </div>

                {/* Bio section */}
                {user.bio && (
                  <div className="mb-6">
                    <p className="text-sm text-foreground/80 text-center" data-testid="profile-bio">
                      {user.bio}
                    </p>
                  </div>
                )}

                {/* User statistics */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary" data-testid="stat-watched">
                      {stats.totalWatched}
                    </p>
                    <p className="text-xs text-muted-foreground">Watched</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary" data-testid="stat-watchlist">
                      {stats.watchlistCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Watchlist</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent" data-testid="stat-favorites">
                      {stats.favoritesCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Favorites</p>
                  </div>
                </div>

                {/* Watch time */}
                <div className="mb-6 p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Watch Time</span>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold" data-testid="total-watch-time">
                    {formatWatchTime(stats.totalWatchTime)}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <Button className="w-full" data-testid="edit-profile-button">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="settings-button">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>

                {/* Account info */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joined</span>
                      <span data-testid="join-date">
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Username Change</span>
                      <span data-testid="username-change-availability">
                        {getDaysUntilUsernameChange() === 0 
                          ? "Available now" 
                          : `In ${getDaysUntilUsernameChange()} days`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-2">
            
            {/* Activity overview cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              
              {/* Viewing statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Viewing Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">This Week</span>
                        <span className="font-medium">18h 32m</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">This Month</span>
                        <span className="font-medium">76h 15m</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">All Time</span>
                        <span className="font-medium">{formatWatchTime(stats.totalWatchTime)}</span>
                      </div>
                      <Progress value={90} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">First Watch</p>
                        <p className="text-xs text-muted-foreground">Watched your first episode</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium">Community Member</p>
                        <p className="text-xs text-muted-foreground">Joined the community</p>
                      </div>
                    </div>
                    {stats.totalWatched >= 10 && (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium">Anime Enthusiast</p>
                          <p className="text-xs text-muted-foreground">Completed 10+ anime</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity tabs */}
            <Card>
              <CardHeader>
                <CardTitle>My Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="history" data-testid="history-tab">
                      Watch History
                    </TabsTrigger>
                    <TabsTrigger value="continue" data-testid="continue-tab">
                      Continue Watching
                    </TabsTrigger>
                    <TabsTrigger value="watchlist" data-testid="watchlist-tab">
                      Watchlist
                    </TabsTrigger>
                    <TabsTrigger value="favorites" data-testid="favorites-tab">
                      Favorites
                    </TabsTrigger>
                  </TabsList>

                  {/* Watch History Tab */}
                  <TabsContent value="history" className="mt-6">
                    {isLoadingHistory ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="flex items-center space-x-4 p-4">
                            <Skeleton className="w-24 h-16 rounded" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                          </div>
                        ))}
                      </div>
                    ) : watchHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No watch history yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {watchHistory.slice(0, 10).map((item: any) => (
                          <div 
                            key={item.id} 
                            className="flex items-center space-x-4 p-4 hover:bg-muted/10 rounded-lg transition-smooth"
                            data-testid={`history-item-${item.id}`}
                          >
                            <div className="w-24 h-16 rounded overflow-hidden bg-muted">
                              <img
                                src={`https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&h=120&fit=crop`}
                                alt="Episode thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold mb-1 truncate">Anime Title</h4>
                              <p className="text-sm text-muted-foreground truncate">
                                Episode {item.episodeNumber || 1} - Episode Title
                              </p>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex-1 h-1 bg-muted rounded-full">
                                  <div 
                                    className="h-full bg-primary rounded-full" 
                                    style={{ width: `${item.completed ? 100 : (item.progress / 1440) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDistanceToNow(new Date(item.watchedAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                            <Button size="sm" data-testid={`continue-watching-${item.id}`}>
                              Continue
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Continue Watching Tab */}
                  <TabsContent value="continue" className="mt-6">
                    {isLoadingContinue ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div key={index} className="space-y-2">
                            <Skeleton className="aspect-[2/3] w-full rounded" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        ))}
                      </div>
                    ) : continueWatching.length === 0 ? (
                      <div className="text-center py-8">
                        <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No anime in progress</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {continueWatching.map((item: any) => (
                          <AnimeCard
                            key={item.id}
                            anime={item}
                            showProgress={true}
                            progress={85} // Mock progress
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Watchlist Tab */}
                  <TabsContent value="watchlist" className="mt-6">
                    {isLoadingWatchlist ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div key={index} className="space-y-2">
                            <Skeleton className="aspect-[2/3] w-full rounded" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        ))}
                      </div>
                    ) : watchlist.length === 0 ? (
                      <div className="text-center py-8">
                        <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Your watchlist is empty</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {watchlist.map((item: any) => (
                          <AnimeCard
                            key={item.id}
                            anime={item}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Favorites Tab */}
                  <TabsContent value="favorites" className="mt-6">
                    {isLoadingFavorites ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div key={index} className="space-y-2">
                            <Skeleton className="aspect-[2/3] w-full rounded" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        ))}
                      </div>
                    ) : favorites.length === 0 ? (
                      <div className="text-center py-8">
                        <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No favorite anime yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {favorites.map((item: any) => (
                          <AnimeCard
                            key={item.id}
                            anime={item}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
