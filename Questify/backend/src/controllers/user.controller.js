import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/error.middleware.js';

// Get user profile
export const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_hobbies(
          hobby:hobbies(*)
        ),
        user_achievements(
          achievement:achievements(*)
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw new AppError('User not found', 404);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        points: user.points,
        level: user.level,
        currentStreak: user.current_streak,
        longestStreak: user.longest_streak,
        totalQuestsCompleted: user.total_quests_completed,
        hobbies: user.user_hobbies?.map(uh => uh.hobby) || [],
        achievements: user.user_achievements?.map(ua => ua.achievement) || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add user hobbies
export const addUserHobbies = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { hobbyIds } = req.body;

    if (!Array.isArray(hobbyIds) || hobbyIds.length === 0) {
      throw new AppError('Hobby IDs array is required', 400);
    }

    // Delete existing hobbies
    await supabaseAdmin
      .from('user_hobbies')
      .delete()
      .eq('user_id', userId);

    // Insert new hobbies
    const userHobbies = hobbyIds.map(hobbyId => ({
      user_id: userId,
      hobby_id: hobbyId
    }));

    const { data, error } = await supabaseAdmin
      .from('user_hobbies')
      .insert(userHobbies)
      .select('*, hobby:hobbies(*)');

    if (error) throw new AppError('Failed to add hobbies', 500);

    res.json({
      message: 'Hobbies updated successfully',
      hobbies: data.map(uh => uh.hobby)
    });
  } catch (error) {
    next(error);
  }
};

// Get user stats
export const getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Get user basic stats
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('points, level, current_streak, longest_streak, total_quests_completed')
      .eq('id', userId)
      .single();

    // Get active quests count
    const { count: activeQuests } = await supabaseAdmin
      .from('user_quests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Get posts count
    const { count: totalPosts } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get achievements count
    const { count: achievementsCount } = await supabaseAdmin
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    res.json({
      stats: {
        ...user,
        activeQuests: activeQuests || 0,
        totalPosts: totalPosts || 0,
        achievements: achievementsCount || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
