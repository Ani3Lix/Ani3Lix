import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Smile, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { commentsApi } from "@/lib/api";
import { CommentItem } from "./CommentItem";
import { Comment } from "@/types";

interface CommentSectionProps {
  animeId?: string; // For anime-level comments
  episodeId?: string; // For episode-level comments
  className?: string;
}

// Comment section with nested replies and moderation capabilities
export function CommentSection({ animeId, episodeId, className = "" }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth(); // Get current user context
  const queryClient = useQueryClient(); // For cache invalidation
  
  const [newComment, setNewComment] = useState(""); // New comment input
  const [sortBy, setSortBy] = useState<"latest" | "top">("latest"); // Comment sorting
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // Track reply state

  // Determine query key and API call based on context
  const queryKey = animeId 
    ? ["/api/anime", animeId, "comments"]
    : ["/api/episodes", episodeId, "comments"];
  
  // Fetch comments for the anime or episode
  const { 
    data: commentsData, 
    isLoading: isLoadingComments, 
    error: commentsError 
  } = useQuery({
    queryKey,
    queryFn: () => animeId 
      ? commentsApi.getAnimeComments(animeId) 
      : commentsApi.getEpisodeComments(episodeId!),
    enabled: !!(animeId || episodeId), // Only run if we have an ID
  });

  // Post new comment mutation
  const postCommentMutation = useMutation({
    mutationFn: (commentData: { content: string; animeId?: string; episodeId?: string; parentCommentId?: string }) =>
      commentsApi.createComment(commentData),
    onSuccess: () => {
      // Clear input and refresh comments
      setNewComment("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      // TODO: Show login modal or redirect
      return;
    }

    if (!newComment.trim()) return;

    const commentData = {
      content: newComment.trim(),
      animeId,
      episodeId,
      parentCommentId: replyingTo, // For replies
    };

    await postCommentMutation.mutateAsync(commentData);
  };

  // Handle reply to comment
  const handleReplyToComment = (commentId: string) => {
    setReplyingTo(commentId);
    // Focus on the comment input
    document.getElementById("comment-input")?.focus();
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  // Filter and sort comments
  const processComments = (comments: Comment[]): Comment[] => {
    if (!comments) return [];

    // Filter top-level comments (no parent)
    const topLevelComments = comments.filter(comment => !comment.parentCommentId);
    
    // Sort comments based on selected option
    const sortedComments = topLevelComments.sort((a, b) => {
      if (sortBy === "top") {
        return b.likes - a.likes; // Sort by likes descending
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Sort by newest first
    });

    // Add replies to each comment
    return sortedComments.map(comment => ({
      ...comment,
      replies: comments
        .filter(reply => reply.parentCommentId === comment.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // Replies chronological
    }));
  };

  const processedComments = processComments(commentsData?.comments || []);

  return (
    <div className={`mt-12 ${className}`} data-testid="comment-section">
      
      {/* Comments header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <MessageSquare className="w-6 h-6 mr-2" />
          Comments
          {commentsData?.comments && (
            <span className="ml-2 text-lg text-muted-foreground">
              ({commentsData.comments.length})
            </span>
          )}
        </h2>
        
        {/* Sort options */}
        <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as "latest" | "top")}>
          <TabsList>
            <TabsTrigger value="latest" data-testid="sort-latest">Latest</TabsTrigger>
            <TabsTrigger value="top" data-testid="sort-top">Top</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Comment input form */}
      {isAuthenticated ? (
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSubmitComment}>
              
              {/* Reply indicator */}
              {replyingTo && (
                <div className="mb-3 p-2 bg-accent/10 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Replying to comment
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelReply}
                    data-testid="cancel-reply-button"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <div className="flex space-x-4">
                {/* User avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt="Your avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <Textarea
                    id="comment-input"
                    placeholder={replyingTo ? "Write a reply..." : "Share your thoughts about this anime..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="resize-none"
                    data-testid="comment-input"
                  />
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        data-testid="emoji-button"
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        data-testid="image-button"
                      >
                        <Image className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={!newComment.trim() || postCommentMutation.isPending}
                      data-testid="submit-comment-button"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {replyingTo ? "Reply" : "Post Comment"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        // Login prompt for unauthenticated users
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Join the Discussion</h3>
            <p className="text-muted-foreground mb-4">
              Sign in to share your thoughts and engage with the community.
            </p>
            <Button data-testid="login-to-comment-button">
              Sign In to Comment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {isLoadingComments ? (
          // Loading skeletons
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={`comment-skeleton-${index}`}>
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex space-x-4">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : commentsError ? (
          // Error state
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-destructive mb-4">Failed to load comments</p>
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey })}
                data-testid="retry-comments-button"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : processedComments.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No comments yet</h3>
              <p className="text-muted-foreground">
                Be the first to share your thoughts about this {animeId ? 'anime' : 'episode'}!
              </p>
            </CardContent>
          </Card>
        ) : (
          // Comments list
          processedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReplyToComment}
              data-testid={`comment-${comment.id}`}
            />
          ))
        )}
      </div>

      {/* Load more button if needed */}
      {processedComments.length >= 10 && (
        <div className="text-center mt-8">
          <Button 
            variant="outline"
            data-testid="load-more-comments-button"
          >
            Load More Comments
          </Button>
        </div>
      )}
    </div>
  );
}

