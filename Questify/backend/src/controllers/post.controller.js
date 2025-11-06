import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/error.middleware.js';

// Create a post
export const createPost = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { content, questId, userQuestId, progressValue } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!content && !imageUrl) {
      throw new AppError('Post must have content or an image', 400);
    }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: userId,
        quest_id: questId || null,
        user_quest_id: userQuestId || null,
        content,
        image_url: imageUrl,
        progress_value: progressValue || null
      })
      .select(`
        *,
        user:users(id, username, full_name, avatar_url),
        quest:quests(id, title, hobby:hobbies(name, icon))
      `)
      .single();

    if (error) throw new AppError('Failed to create post', 500);

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('post-created', post);

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    next(error);
  }
};

// Get feed (all posts)
export const getFeed = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, questId, userId } = req.query;
    const currentUserId = req.user?.id;

    let query = supabaseAdmin
      .from('posts')
      .select(`
        *,
        user:users(id, username, full_name, avatar_url, level),
        quest:quests(id, title, hobby:hobbies(name, icon)),
        post_likes!left(user_id),
        comments(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (questId) query = query.eq('quest_id', questId);
    if (userId) query = query.eq('user_id', userId);

    const { data: posts, error } = await query;

    if (error) throw new AppError('Failed to fetch posts', 500);

    // Add isLikedByUser flag
    const postsWithLikes = posts.map(post => ({
      ...post,
      isLikedByUser: currentUserId
        ? post.post_likes?.some(like => like.user_id === currentUserId)
        : false,
      likesCount: post.likes_count,
      commentsCount: post.comments_count
    }));

    res.json({ posts: postsWithLikes });
  } catch (error) {
    next(error);
  }
};

// Get single post
export const getPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.user?.id;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        user:users(id, username, full_name, avatar_url, level),
        quest:quests(id, title, hobby:hobbies(name, icon)),
        comments(
          *,
          user:users(id, username, avatar_url)
        )
      `)
      .eq('id', postId)
      .single();

    if (error) throw new AppError('Post not found', 404);

    // Check if liked by current user
    let isLikedByUser = false;
    if (currentUserId) {
      const { data: like } = await supabaseAdmin
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
        .single();
      isLikedByUser = !!like;
    }

    res.json({
      post: {
        ...post,
        isLikedByUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// Like a post
export const likePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if already liked
    const { data: existing } = await supabaseAdmin
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Unlike
      await supabaseAdmin
        .from('post_likes')
        .delete()
        .eq('id', existing.id);

      // Decrement likes count
      await supabaseAdmin
        .from('posts')
        .update({ likes_count: supabaseAdmin.sql`likes_count - 1` })
        .eq('id', postId);

      return res.json({ message: 'Post unliked', liked: false });
    }

    // Like
    await supabaseAdmin
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });

    // Increment likes count
    await supabaseAdmin
      .from('posts')
      .update({ likes_count: supabaseAdmin.sql`likes_count + 1` })
      .eq('id', postId);

    // Get post owner for notification
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`user-${post.user_id}`).emit('post-liked', {
      postId,
      userId,
      postOwnerId: post.user_id
    });

    res.json({ message: 'Post liked', liked: true });
  } catch (error) {
    next(error);
  }
};

// Comment on a post
export const commentOnPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      throw new AppError('Comment content is required', 400);
    }

    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: content.trim()
      })
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .single();

    if (error) throw new AppError('Failed to create comment', 500);

    // Increment comments count
    await supabaseAdmin
      .from('posts')
      .update({ comments_count: supabaseAdmin.sql`comments_count + 1` })
      .eq('id', postId);

    // Get post owner for notification
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`user-${post.user_id}`).emit('post-commented', {
      postId,
      comment,
      postOwnerId: post.user_id
    });

    res.status(201).json({
      message: 'Comment added',
      comment
    });
  } catch (error) {
    next(error);
  }
};

// Delete a post
export const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) throw new AppError('Failed to delete post', 500);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};
