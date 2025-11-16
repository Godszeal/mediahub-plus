import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ThumbsUp, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CommentSectionProps {
  videoId: string;
}

export const CommentSection = ({ videoId }: CommentSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id (username, avatar_url),
          comment_likes (user_id)
        `)
        .eq("video_id", videoId)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      const { error } = await supabase.from("comments").insert({
        user_id: user!.id,
        video_id: videoId,
        content,
        parent_comment_id: parentId || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      setNewComment("");
      setReplyContent("");
      setReplyTo(null);
      toast.success("Comment posted!");
    },
    onError: () => {
      toast.error("Failed to post comment");
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comment_likes").insert({
        user_id: user!.id,
        comment_id: commentId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
  });

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate({ content: newComment });
  };

  const handlePostReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    createCommentMutation.mutate({ content: replyContent, parentId });
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please login to view and post comments</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Comment Input */}
      <div className="space-y-3">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px]"
        />
        <div className="flex justify-end">
          <Button
            onClick={handlePostComment}
            disabled={!newComment.trim() || createCommentMutation.isPending}
          >
            {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {comments?.map((comment) => (
          <div key={comment.id} className="space-y-3">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                {comment.profiles?.avatar_url ? (
                  <img
                    src={comment.profiles.avatar_url}
                    alt={comment.profiles.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="font-semibold">
                    {comment.profiles?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">
                    {comment.profiles?.username || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mb-2">{comment.content}</p>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-8"
                    onClick={() => likeCommentMutation.mutate(comment.id)}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-xs">{comment.likes}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-8"
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs">Reply</span>
                  </Button>
                </div>

                {/* Reply Input */}
                {replyTo === comment.id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyContent("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePostReply(comment.id)}
                        disabled={!replyContent.trim()}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {comments?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
};
