import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/error.middleware.js';

// Get all active quests
export const getQuests = async (req, res, next) => {
  try {
    const { hobby, difficulty, status = 'active' } = req.query;
    const userId = req.user?.id;

    let query = supabaseAdmin
      .from('quests')
      .select(`
        *,
        hobby:hobbies(*),
        user_quests!left(
          id,
          status,
          progress,
          started_at
        )
      `)
      .eq('is_active', true);

    if (hobby) query = query.eq('hobby_id', hobby);
    if (difficulty) query = query.eq('difficulty', difficulty);

    // Filter user's participation if logged in
    if (userId) {
      query = query.or(`user_quests.user_id.is.null,user_quests.user_id.eq.${userId}`);
    }

    const { data: quests, error } = await query.order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch quests', 500);

    res.json({ quests });
  } catch (error) {
    next(error);
  }
};

// Get quest details
export const getQuestById = async (req, res, next) => {
  try {
    const { questId } = req.params;
    const userId = req.user?.id;

    const { data: quest, error } = await supabaseAdmin
      .from('quests')
      .select(`
        *,
        hobby:hobbies(*),
        user_quests(
          id,
          user_id,
          status,
          progress,
          started_at,
          completed_at,
          user:users(id, username, avatar_url)
        )
      `)
      .eq('id', questId)
      .single();

    if (error) throw new AppError('Quest not found', 404);

    // Get participants count
    const { count: participantsCount } = await supabaseAdmin
      .from('user_quests')
      .select('*', { count: 'exact', head: true })
      .eq('quest_id', questId);

    // Check if current user is participating
    let userParticipation = null;
    if (userId) {
      const { data } = await supabaseAdmin
        .from('user_quests')
        .select('*')
        .eq('quest_id', questId)
        .eq('user_id', userId)
        .single();
      userParticipation = data;
    }

    res.json({
      quest: {
        ...quest,
        participantsCount: participantsCount || 0,
        userParticipation
      }
    });
  } catch (error) {
    next(error);
  }
};

// Join a quest
export const joinQuest = async (req, res, next) => {
  try {
    const { questId } = req.params;
    const userId = req.user.id;

    // Check if quest exists
    const { data: quest, error: questError } = await supabaseAdmin
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('is_active', true)
      .single();

    if (questError) throw new AppError('Quest not found', 404);

    // Check if already joined
    const { data: existing } = await supabaseAdmin
      .from('user_quests')
      .select('*')
      .eq('quest_id', questId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new AppError('You have already joined this quest', 400);
    }

    // Join quest
    const { data: userQuest, error } = await supabaseAdmin
      .from('user_quests')
      .insert({
        user_id: userId,
        quest_id: questId,
        status: 'active',
        progress: 0
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to join quest', 500);

    res.status(201).json({
      message: 'Successfully joined quest',
      userQuest
    });
  } catch (error) {
    next(error);
  }
};

// Update quest progress
export const updateQuestProgress = async (req, res, next) => {
  try {
    const { questId } = req.params;
    const { progress } = req.body;
    const userId = req.user.id;

    if (typeof progress !== 'number') {
      throw new AppError('Progress must be a number', 400);
    }

    // Get user quest
    const { data: userQuest, error: fetchError } = await supabaseAdmin
      .from('user_quests')
      .select('*, quest:quests(*)')
      .eq('quest_id', questId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw new AppError('Quest participation not found', 404);

    // Check if quest is completed
    const isCompleted = progress >= userQuest.quest.target_value;

    const updates = {
      progress,
      last_activity_at: new Date().toISOString()
    };

    if (isCompleted && userQuest.status !== 'completed') {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();

      // Award points and XP
      await supabaseAdmin.rpc('award_quest_completion', {
        p_user_id: userId,
        p_points: userQuest.quest.points_reward,
        p_xp: userQuest.quest.xp_reward
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('user_quests')
      .update(updates)
      .eq('id', userQuest.id)
      .select()
      .single();

    if (error) throw new AppError('Failed to update progress', 500);

    res.json({
      message: isCompleted ? 'Quest completed! 🎉' : 'Progress updated',
      userQuest: updated,
      completed: isCompleted
    });
  } catch (error) {
    next(error);
  }
};

// Get user's quests
export const getMyQuests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = supabaseAdmin
      .from('user_quests')
      .select(`
        *,
        quest:quests(
          *,
          hobby:hobbies(*)
        )
      `)
      .eq('user_id', userId);

    if (status) query = query.eq('status', status);

    const { data: userQuests, error } = await query.order('started_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch quests', 500);

    res.json({ quests: userQuests });
  } catch (error) {
    next(error);
  }
};
