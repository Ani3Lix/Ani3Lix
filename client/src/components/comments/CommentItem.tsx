import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Reply, Flag, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { commentsApi } from "@/lib/api";
import { Comment } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface CommentItemProps {
  comment: Comment;
  onReply?: (commentId: string) => void;
  isReply?: boolean; // Whether this is a nested reply
  className?: string;
}

// Individual comment component with replies, editing, and moderation
export function CommentItem({ comment, onReply, isReply = false, className = "" }: CommentItemProps) {
  const { user, isAuthenticated, hasRole } = useAuth(); // Authentication context
  const queryClient = useQueryClient(); // For cache updates
  
  const [isEditing, setIsEditing] = useState(false); // Edit mode state
  const [editContent, setEditContent] = useState(comment.content); // Edited content
  const [showReplies, setShowReplies] = useState(true); // Toggle nested replies

  // Check if current user can modify this comment
  const canEdit = isAuthenticated && user?.id === comment.userId;
  const canDelete = canEdit || hasRole("moderator");
  const canModerate = hasRole("moderator");

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: () => commentsApi.likeComment(comment.id),
    onSuccess: () => {
      // Optimistically update the likes count
      queryClient.invalidateQueries({ 
        queryKey: comment.animeId 
          ? ["/api/anime", comment.animeId, "comments"]
          : ["/api/episodes", comment.episodeId, "comments"]
      });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: (content: string) => commentsApi.updateComment(comment.id, content),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ 
        queryKey: comment.animeId 
          ? ["/api/anime", comment.animeId, "comments"]
          : ["/api/episodes", comment.episodeId, "comments"]
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: () => commentsApi.deleteComment(comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: comment.animeId 
          ? ["/api/anime", comment.animeId, "comments"]
          : ["/api/episodes", comment.episodeId, "comments"]
      });
    },
  });

  // Handle like action
  const handleLike = () => {
    if (!isAuthenticated) return;
    likeCommentMutation.mutate();
  };

  // Handle edit submission
  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      editCommentMutation.mutate(editContent.trim());
    } else {
      setIsEditing(false);
    }
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  // Handle delete action
  const handleDelete = () => {
    deleteCommentMutation.mutate();
  };

  // Handle reply action
  const handleReply = () => {
    onReply?.(comment.id);
  };

  // Get user role badge
  const getUserRoleBadge = (userRole: string) => {
    switch (userRole) {
      case "site_owner":
        return <Badge variant="destructive" className="text-xs">Owner</Badge>;
      case "admin":
        return <Badge variant="destructive" className="text-xs">Admin</Badge>;
      case "moderator":
        return <Badge className="bg-accent text-accent-foreground text-xs">Moderator</Badge>;
      default:
        return null;
    }
  };

  // Format relative time
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  return (
    <Card className={`${isReply ? 'ml-8 border-l-4 border-l-border' : ''} ${className}`} data-testid={`comment-item-${comment.id}`}>
      <CardContent className="p-4">
        <div className="flex space-x-4">
          
          {/* User avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            {comment.user?.avatarUrl ? (
              <img 
                src={comment.user.avatarUrl} 
                alt={`${comment.user.displayName || comment.user.username} avatar`}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium">
                {comment.user?.displayName?.charAt(0) || comment.user?.username?.charAt(0) || 'U'}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            
            {/* Comment header */}
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-sm" data-testid="comment-author">
                {comment.user?.displayName || comment.user?.username || 'Anonymous'}
              </span>
              {comment.user?.role && getUserRoleBadge(comment.user.role)}
              <span className="text-xs text-muted-foreground" data-testid="comment-time">
                {timeAgo}
              </span>
              {comment.updatedAt !== comment.createdAt && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>

            {/* Comment content */}
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="edit-comment-input"
                />
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleEditSubmit}
                    disabled={!editContent.trim() || editCommentMutation.isPending}
                    data-testid="save-edit-button"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditCancel}
                    data-testid="cancel-edit-button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-3">
                {comment.isDeleted ? (
                  <p className="text-muted-foreground italic">This comment has been deleted</p>
                ) : (
                  <p className="text-foreground/90 whitespace-pre-wrap" data-testid="comment-content">
                    {comment.content}
                  </p>
                )}
              </div>
            )}

            {/* Comment actions */}
            {!comment.isDeleted && !isEditing && (
              <div className="flex items-center space-x-4">
                
                {/* Like button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={!isAuthenticated || likeCommentMutation.isPending}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="like-comment-button"
                >
                  <Heart className={`w-4 h-4 mr-1 ${comment.likes > 0 ? 'fill-current text-red-500' : ''}`} />
                  {comment.likes}
                </Button>

                {/* Reply button */}
                {!isReply && isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReply}
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="reply-comment-button"
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Reply
                  </Button>
                )}

                {/* Report button for non-owners */}
                {isAuthenticated && user?.id !== comment.userId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    data-testid="report-comment-button"
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    Report
                  </Button>
                )}

                {/* Actions dropdown for comment owner/moderators */}
                {(canEdit || canModerate) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        data-testid="comment-actions-button"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      
                      {canEdit && (
                        <DropdownMenuItem onClick={() => setIsEditing(true)} data-testid="edit-comment-menu">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      
                      {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              data-testid="delete-comment-menu"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this comment? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid="confirm-delete-comment"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            
            {/* Toggle replies button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="mb-3 text-muted-foreground hover:text-foreground"
              data-testid="toggle-replies-button"
            >
              {showReplies ? 'Hide' : 'Show'} {comment.replies.length} repl{comment.replies.length === 1 ? 'y' : 'ies'}
            </Button>

            {/* Replies list */}
            {showReplies && (
              <div className="space-y-4">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    isReply={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

