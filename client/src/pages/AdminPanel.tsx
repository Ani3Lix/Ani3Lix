import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, 
  Search, 
  Plus, 
  Users, 
  BarChart3, 
  Settings,
  Eye,
  Upload,
  Check,
  X,
  Edit,
  Trash2,
  UserPlus,
  Crown,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { AnimeSearch } from "@/components/admin/AnimeSearch";
import { AnimePreview } from "@/components/admin/AnimePreview";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { animeApi, adminApi, anilistService } from "@/lib/api";
import { AniListAnime, Anime } from "@/types";

// Admin panel component with comprehensive platform management
function AdminPanel() {
  const { user, hasRole } = useAuth(); // Authentication context
  const { toast } = useToast(); // Toast notifications
  const queryClient = useQueryClient(); // Query cache management

  // State management
  const [activeTab, setActiveTab] = useState("anime"); // Active admin tab
  const [selectedAnime, setSelectedAnime] = useState<AniListAnime | null>(null); // Selected anime from AniList
  const [previewAnime, setPreviewAnime] = useState<Anime | null>(null); // Anime being previewed
  const [userSearchQuery, setUserSearchQuery] = useState(""); // User search input
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all"); // User role filter

  // Fetch draft anime for admin review
  const { data: draftAnimeData, isLoading: isLoadingDrafts } = useQuery({
    queryKey: ["/api/anime", "draft"],
    queryFn: () => animeApi.getAnime(), // Will need to add status filter
    enabled: hasRole("admin"),
  });

  // Fetch published anime for management
  const { data: publishedAnimeData, isLoading: isLoadingPublished } = useQuery({
    queryKey: ["/api/anime", "published"],
    queryFn: () => animeApi.getAnime(),
    enabled: hasRole("admin"),
  });

  // Fetch users for management (if admin/site_owner)
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users", userRoleFilter],
    queryFn: () => adminApi.getUsers(userRoleFilter === "all" ? undefined : userRoleFilter),
    enabled: hasRole("admin"),
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role, reason }: { userId: string; role: string; reason?: string }) =>
      adminApi.updateUserRole(userId, role, reason),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  // Handle anime selection from AniList search
  const handleAnimeSelect = (anime: AniListAnime) => {
    setSelectedAnime(anime);
    setPreviewAnime(null); // Clear any existing preview
  };

  // Handle anime publish success
  const handleAnimePublish = (anime: Anime) => {
    toast({
      title: "Anime Published",
      description: `${anime.title} is now live on the platform`,
    });
    setSelectedAnime(null);
    queryClient.invalidateQueries({ queryKey: ["/api/anime"] });
  };

  // Handle anime draft save
  const handleAnimeDraft = (anime: Anime) => {
    toast({
      title: "Draft Saved",
      description: `${anime.title} has been saved as a draft`,
    });
    setSelectedAnime(null);
    queryClient.invalidateQueries({ queryKey: ["/api/anime"] });
  };

  // Handle user role change
  const handleUserRoleChange = (userId: string, newRole: string, currentRole: string) => {
    const reason = `Role changed from ${currentRole} to ${newRole} by admin`;
    updateUserRoleMutation.mutate({ userId, role: newRole, reason });
  };

  // Filter users based on search and role
  const filteredUsers = usersData?.users?.filter((user: any) => {
    const matchesSearch = user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                         (user.displayName && user.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()));
    return matchesSearch;
  }) || [];

  // Get role color for badges
  const getRoleColor = (role: string) => {
    switch (role) {
      case "site_owner":
        return "bg-destructive text-destructive-foreground";
      case "admin":
        return "bg-destructive/80 text-destructive-foreground";
      case "moderator":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  // Check if user can modify role
  const canModifyRole = (targetRole: string) => {
    if (user?.role === "site_owner") return true;
    if (user?.role === "admin") {
      return targetRole !== "admin" && targetRole !== "site_owner";
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Admin header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">
                Manage anime content, users, and platform settings
              </p>
            </div>
          </div>
          
          {/* Admin stats overview */}
          <div className="grid md:grid-cols-4 gap-6 mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Anime</p>
                    <p className="text-2xl font-bold">
                      {(publishedAnimeData?.anime?.length || 0) + (draftAnimeData?.anime?.length || 0)}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Published</p>
                    <p className="text-2xl font-bold text-green-500">
                      {publishedAnimeData?.anime?.length || 0}
                    </p>
                  </div>
                  <Check className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Drafts</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {draftAnimeData?.anime?.filter((a: Anime) => a.status === "draft")?.length || 0}
                    </p>
                  </div>
                  <Edit className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">
                      {filteredUsers.length}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="anime" data-testid="anime-management-tab">
              Anime Management
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="user-management-tab">
              User Management
            </TabsTrigger>
            <TabsTrigger value="moderation" data-testid="moderation-tab">
              Moderation Queue
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="analytics-tab">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Anime Management Tab */}
          <TabsContent value="anime" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* AniList Search Section */}
              <div>
                <AnimeSearch 
                  onSelectAnime={handleAnimeSelect}
                  className="h-fit"
                />
              </div>

              {/* Preview Section */}
              <div>
                <AnimePreview
                  selectedAnime={selectedAnime}
                  existingAnime={previewAnime}
                  onPublish={handleAnimePublish}
                  onSaveDraft={handleAnimeDraft}
                />
              </div>
            </div>

            {/* Draft and Published Anime Lists */}
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Draft Anime */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Edit className="w-5 h-5 mr-2 text-yellow-500" />
                    Draft Anime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingDrafts ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3">
                          <Skeleton className="w-12 h-16 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-8 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {draftAnimeData?.anime?.filter((anime: Anime) => anime.status === "draft").map((anime: Anime) => (
                          <div 
                            key={anime.id} 
                            className="flex items-center space-x-3 p-3 hover:bg-muted/10 rounded-lg cursor-pointer"
                            onClick={() => setPreviewAnime(anime)}
                            data-testid={`draft-anime-${anime.id}`}
                          >
                            <img
                              src={anime.coverImageUrl || "/placeholder.jpg"}
                              alt={anime.title}
                              className="w-12 h-16 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{anime.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {anime.episodeCount || 0} episodes
                              </p>
                            </div>
                            <Badge variant="secondary">Draft</Badge>
                          </div>
                        ))}
                        {(!draftAnimeData?.anime || draftAnimeData.anime.filter((a: Anime) => a.status === "draft").length === 0) && (
                          <div className="text-center py-8 text-muted-foreground">
                            No draft anime found
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Published Anime */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Check className="w-5 h-5 mr-2 text-green-500" />
                    Published Anime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingPublished ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3">
                          <Skeleton className="w-12 h-16 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-8 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {publishedAnimeData?.anime?.filter((anime: Anime) => anime.status === "published").map((anime: Anime) => (
                          <div 
                            key={anime.id} 
                            className="flex items-center space-x-3 p-3 hover:bg-muted/10 rounded-lg cursor-pointer"
                            onClick={() => setPreviewAnime(anime)}
                            data-testid={`published-anime-${anime.id}`}
                          >
                            <img
                              src={anime.coverImageUrl || "/placeholder.jpg"}
                              alt={anime.title}
                              className="w-12 h-16 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{anime.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {anime.episodeCount || 0} episodes
                              </p>
                            </div>
                            <Badge variant="default">Live</Badge>
                          </div>
                        ))}
                        {(!publishedAnimeData?.anime || publishedAnimeData.anime.filter((a: Anime) => a.status === "published").length === 0) && (
                          <div className="text-center py-8 text-muted-foreground">
                            No published anime found
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            
            {/* User management header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">User Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="user-search-input"
                  />
                </div>
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="moderator">Moderators</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="site_owner">Site Owners</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Users list */}
            <Card>
              <CardContent className="p-6">
                {isLoadingUsers ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map((user: any) => (
                      <div 
                        key={user.id} 
                        className="flex items-center space-x-4 p-4 hover:bg-muted/10 rounded-lg"
                        data-testid={`user-item-${user.id}`}
                      >
                        {/* User avatar */}
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.displayName || user.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="font-medium">
                              {(user.displayName || user.username).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* User info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{user.displayName || user.username}</h4>
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.email} • @{user.username}
                          </p>
                        </div>

                        {/* Role management */}
                        {canModifyRole(user.role) && user.id !== user?.id && (
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleUserRoleChange(user.id, newRole, user.role)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              {hasRole("site_owner") && (
                                <SelectItem value="admin">Admin</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" data-testid={`view-user-${user.id}`}>
                            View Profile
                          </Button>
                          {user.role !== "site_owner" && user.id !== user?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" data-testid={`ban-user-${user.id}`}>
                                  Ban
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ban User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to ban {user.displayName || user.username}? 
                                    This action will prevent them from accessing the platform.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground">
                                    Ban User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No users found matching your criteria
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moderation Queue Tab */}
          <TabsContent value="moderation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                  Moderation Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Items in Queue</h3>
                  <p>All reported content has been reviewed.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Platform Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Users</span>
                      <span className="font-bold">{filteredUsers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Users (30d)</span>
                      <span className="font-bold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Watch Time</span>
                      <span className="font-bold">0h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Published Anime</span>
                      <span className="font-bold">{publishedAnimeData?.anime?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Draft Anime</span>
                      <span className="font-bold">{draftAnimeData?.anime?.filter((a: Anime) => a.status === "draft")?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Episodes</span>
                      <span className="font-bold">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

// Export with authentication HOC requiring admin role
export default withAuth(AdminPanel, "admin");
