import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Check, 
  Save, 
  Edit, 
  Trash2, 
  Plus, 
  ExternalLink, 
  Calendar, 
  Star, 
  Play,
  Eye,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { animeApi, episodeApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AniListAnime, Anime, Episode } from "@/types";

interface AnimePreviewProps {
  selectedAnime: AniListAnime | null; // Currently selected anime from AniList
  existingAnime?: Anime; // If editing existing anime
  onPublish?: (anime: Anime) => void; // Callback when anime is published
  onSaveDraft?: (anime: Anime) => void; // Callback when saved as draft
  className?: string;
}

// Episode form data interface
interface EpisodeFormData {
  episodeNumber: number;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  description?: string;
}

// Admin component for previewing and managing anime before publication
export function AnimePreview({ 
  selectedAnime, 
  existingAnime, 
  onPublish, 
  onSaveDraft, 
  className = "" 
}: AnimePreviewProps) {
  const { toast } = useToast(); // Toast notifications
  const queryClient = useQueryClient(); // Cache management

  // Form state for anime metadata editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  
  // Episode management state
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isAddingEpisode, setIsAddingEpisode] = useState(false);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);
  const [episodeForm, setEpisodeForm] = useState<EpisodeFormData>({
    episodeNumber: 1,
    title: "",
    videoUrl: "",
    thumbnailUrl: "",
    duration: 0,
    description: "",
  });

  // Get the anime data to display (selected or existing)
  const animeData = existingAnime || selectedAnime;

  // Initialize form data when anime changes
  React.useEffect(() => {
    if (animeData) {
      if ('title' in animeData) {
        // Existing anime from database
        setEditedTitle(animeData.title);
        setEditedDescription(animeData.description || "");
      } else {
        // New anime from AniList
        setEditedTitle(animeData.title.english || animeData.title.romaji);
        setEditedDescription(animeData.description?.replace(/<[^>]*>/g, '') || "");
      }
    }
  }, [animeData]);

  // Create anime mutation
  const createAnimeMutation = useMutation({
    mutationFn: (animeData: any) => animeApi.createAnime(animeData),
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: "Anime added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/anime"] });
      if (response.anime.status === "published") {
        onPublish?.(response.anime);
      } else {
        onSaveDraft?.(response.anime);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add anime",
        variant: "destructive",
      });
    },
  });

  // Update anime mutation
  const updateAnimeMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      animeApi.updateAnime(id, updates),
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: "Anime updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/anime"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update anime",
        variant: "destructive",
      });
    },
  });

  // Publish anime mutation
  const publishAnimeMutation = useMutation({
    mutationFn: (id: string) => animeApi.publishAnime(id),
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: "Anime published successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/anime"] });
      onPublish?.(response.anime);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish anime",
        variant: "destructive",
      });
    },
  });

  // Add episode mutation
  const addEpisodeMutation = useMutation({
    mutationFn: (episodeData: any) => 
      episodeApi.createEpisode(existingAnime!.id, episodeData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Episode added successfully",
      });
      resetEpisodeForm();
      setIsAddingEpisode(false);
      // Refetch episodes
      queryClient.invalidateQueries({ 
        queryKey: ["/api/anime", existingAnime!.id, "episodes"] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add episode",
        variant: "destructive",
      });
    },
  });

  // Handle saving anime as draft
  const handleSaveDraft = async () => {
    if (!selectedAnime) return;

    const animeData = {
      anilistId: selectedAnime.id,
      title: editedTitle,
      description: editedDescription,
      coverImageUrl: selectedAnime.coverImage.extraLarge,
      bannerImageUrl: selectedAnime.bannerImage,
      rating: selectedAnime.averageScore ? Math.round(selectedAnime.averageScore / 10) : undefined,
      episodeCount: selectedAnime.episodes,
      year: selectedAnime.startDate.year || selectedAnime.seasonYear,
      status: "draft" as const,
      metadata: {
        titles: selectedAnime.title,
        genres: selectedAnime.genres,
        status: selectedAnime.status,
        season: selectedAnime.season,
        seasonYear: selectedAnime.seasonYear,
        studios: selectedAnime.studios.nodes,
        averageScore: selectedAnime.averageScore,
        popularity: selectedAnime.popularity,
        favourites: selectedAnime.favourites,
        startDate: selectedAnime.startDate,
        endDate: selectedAnime.endDate,
      },
    };

    await createAnimeMutation.mutateAsync(animeData);
  };

  // Handle publishing anime
  const handlePublish = async () => {
    if (existingAnime && existingAnime.status === "draft") {
      // Publish existing draft
      await publishAnimeMutation.mutateAsync(existingAnime.id);
    } else if (selectedAnime) {
      // Create and publish new anime
      const animeData = {
        anilistId: selectedAnime.id,
        title: editedTitle,
        description: editedDescription,
        coverImageUrl: selectedAnime.coverImage.extraLarge,
        bannerImageUrl: selectedAnime.bannerImage,
        rating: selectedAnime.averageScore ? Math.round(selectedAnime.averageScore / 10) : undefined,
        episodeCount: selectedAnime.episodes,
        year: selectedAnime.startDate.year || selectedAnime.seasonYear,
        status: "published" as const,
        metadata: {
          titles: selectedAnime.title,
          genres: selectedAnime.genres,
          status: selectedAnime.status,
          season: selectedAnime.season,
          seasonYear: selectedAnime.seasonYear,
          studios: selectedAnime.studios.nodes,
          averageScore: selectedAnime.averageScore,
          popularity: selectedAnime.popularity,
          favourites: selectedAnime.favourites,
          startDate: selectedAnime.startDate,
          endDate: selectedAnime.endDate,
        },
      };

      await createAnimeMutation.mutateAsync(animeData);
    }
  };

  // Handle saving edits
  const handleSaveEdits = async () => {
    if (!existingAnime) return;

    const updates = {
      title: editedTitle,
      description: editedDescription,
    };

    await updateAnimeMutation.mutateAsync({ id: existingAnime.id, updates });
  };

  // Reset episode form
  const resetEpisodeForm = () => {
    setEpisodeForm({
      episodeNumber: episodes.length + 1,
      title: "",
      videoUrl: "",
      thumbnailUrl: "",
      duration: 0,
      description: "",
    });
  };

  // Handle episode form submission
  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!episodeForm.videoUrl.trim()) {
      toast({
        title: "Error",
        description: "Video URL is required",
        variant: "destructive",
      });
      return;
    }

    await addEpisodeMutation.mutateAsync(episodeForm);
  };

  // Get display data based on anime type
  const getDisplayData = () => {
    if (!animeData) return null;

    if ('title' in animeData) {
      // Existing anime from database
      return {
        title: animeData.title,
        description: animeData.description,
        coverImage: animeData.coverImageUrl,
        bannerImage: animeData.bannerImageUrl,
        genres: animeData.metadata?.genres || [],
        rating: animeData.rating,
        episodes: animeData.episodeCount,
        year: animeData.year,
        status: animeData.status,
        studio: animeData.metadata?.studios?.[0]?.name,
        anilistId: animeData.anilistId,
      };
    } else {
      // New anime from AniList
      return {
        title: animeData.title.english || animeData.title.romaji,
        description: animeData.description?.replace(/<[^>]*>/g, ''),
        coverImage: animeData.coverImage.extraLarge,
        bannerImage: animeData.bannerImage,
        genres: animeData.genres,
        rating: animeData.averageScore ? Math.round(animeData.averageScore / 10) : null,
        episodes: animeData.episodes,
        year: animeData.startDate.year || animeData.seasonYear,
        status: "new",
        studio: animeData.studios.nodes.find(s => s.isAnimationStudio)?.name || animeData.studios.nodes[0]?.name,
        anilistId: animeData.id,
      };
    }
  };

  const displayData = getDisplayData();

  if (!displayData) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Upload className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Anime Selected</h3>
          <p className="text-muted-foreground">
            Search and select an anime from AniList to preview and add to the platform.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="anime-preview">
      
      {/* Preview header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Preview & Publish</h3>
          <p className="text-sm text-muted-foreground">
            Review anime details and manage episodes before publishing
          </p>
        </div>
        
        {existingAnime && (
          <Badge 
            variant={existingAnime.status === "published" ? "default" : "secondary"}
            className="text-xs"
          >
            {existingAnime.status.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Anime preview card */}
      <Card>
        <CardContent className="p-0">
          
          {/* Banner/hero section */}
          {displayData.bannerImage && (
            <div className="relative h-48 overflow-hidden rounded-t-lg">
              <img
                src={displayData.bannerImage}
                alt={`${displayData.title} banner`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isEditing ? (
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="bg-black/50 border-white/20 text-white"
                    />
                  ) : (
                    displayData.title
                  )}
                </h2>
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Cover image and basic info */}
              <div>
                <div className="aspect-[2/3] rounded-lg overflow-hidden mb-4 bg-muted">
                  <img
                    src={displayData.coverImage}
                    alt={`${displayData.title} cover`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Quick stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rating:</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
                      <span>{displayData.rating || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Episodes:</span>
                    <span>{displayData.episodes || "Unknown"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Year:</span>
                    <span>{displayData.year || "Unknown"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Studio:</span>
                    <span className="text-right text-xs">{displayData.studio || "Unknown"}</span>
                  </div>
                </div>

                {/* AniList link */}
                <Separator className="my-4" />
                <a
                  href={`https://anilist.co/anime/${displayData.anilistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-primary hover:text-primary/80 transition-smooth"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on AniList
                </a>
              </div>

              {/* Main content */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Title (if no banner) */}
                {!displayData.bannerImage && (
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      {isEditing ? (
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                        />
                      ) : (
                        displayData.title
                      )}
                    </h2>
                    {existingAnime && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {isEditing ? "Cancel" : "Edit"}
                      </Button>
                    )}
                  </div>
                )}

                {/* Genres */}
                <div>
                  <h4 className="font-medium mb-2">Genres</h4>
                  <div className="flex flex-wrap gap-2">
                    {displayData.genres.map((genre: string) => (
                      <Badge key={genre} variant="outline">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-medium mb-2">Synopsis</h4>
                  {isEditing ? (
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {displayData.description || "No description available."}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3 pt-4">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSaveEdits}
                        disabled={updateAnimeMutation.isPending}
                        data-testid="save-edits-button"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      {existingAnime?.status === "draft" ? (
                        <Button
                          onClick={handlePublish}
                          disabled={publishAnimeMutation.isPending}
                          data-testid="publish-anime-button"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Publish Anime
                        </Button>
                      ) : !existingAnime ? (
                        <>
                          <Button
                            onClick={handlePublish}
                            disabled={createAnimeMutation.isPending}
                            data-testid="publish-new-anime-button"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Publish Now
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={createAnimeMutation.isPending}
                            data-testid="save-draft-button"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save as Draft
                          </Button>
                        </>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Episode management (only for existing anime) */}
      {existingAnime && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Play className="w-5 h-5 mr-2" />
                Episodes
              </CardTitle>
              <Button
                onClick={() => setIsAddingEpisode(true)}
                size="sm"
                data-testid="add-episode-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Episode
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            
            {/* Add episode dialog */}
            <Dialog open={isAddingEpisode} onOpenChange={setIsAddingEpisode}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Episode</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddEpisode} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Episode Number</label>
                      <Input
                        type="number"
                        value={episodeForm.episodeNumber}
                        onChange={(e) => setEpisodeForm(prev => ({
                          ...prev,
                          episodeNumber: parseInt(e.target.value) || 1
                        }))}
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Duration (minutes)</label>
                      <Input
                        type="number"
                        value={episodeForm.duration || ''}
                        onChange={(e) => setEpisodeForm(prev => ({
                          ...prev,
                          duration: parseInt(e.target.value) || undefined
                        }))}
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Episode Title</label>
                    <Input
                      value={episodeForm.title}
                      onChange={(e) => setEpisodeForm(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                      placeholder="Optional episode title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Video URL *</label>
                    <Input
                      value={episodeForm.videoUrl}
                      onChange={(e) => setEpisodeForm(prev => ({
                        ...prev,
                        videoUrl: e.target.value
                      }))}
                      placeholder="https://example.com/video.mp4"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Thumbnail URL</label>
                    <Input
                      value={episodeForm.thumbnailUrl}
                      onChange={(e) => setEpisodeForm(prev => ({
                        ...prev,
                        thumbnailUrl: e.target.value
                      }))}
                      placeholder="https://example.com/thumbnail.jpg"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={episodeForm.description}
                      onChange={(e) => setEpisodeForm(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      placeholder="Optional episode description"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={addEpisodeMutation.isPending}
                      data-testid="submit-episode-button"
                    >
                      Add Episode
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingEpisode(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Episodes list placeholder */}
            <div className="space-y-2">
              {episodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4" />
                  <p>No episodes added yet</p>
                  <p className="text-sm">Add episodes to make this anime watchable</p>
                </div>
              ) : (
                episodes.map((episode) => (
                  <div
                    key={episode.id}
                    className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">Episode {episode.episodeNumber}</span>
                      {episode.title && (
                        <span className="text-muted-foreground ml-2">- {episode.title}</span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
