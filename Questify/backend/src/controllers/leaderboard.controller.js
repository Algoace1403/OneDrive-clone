import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/error.middleware.js';

// Get global leaderboard
export const getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0, period = 'all-time' } = req.query;

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, full_name, avatar_url, points, level, current_streak')
      .order('points', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError('Failed to fetch leaderboard', 500);

    // Add rank
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: offset + index + 1
    }));

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
};

// Get user's rank
export const getUserRank = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's points
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (userError) throw new AppError('User not found', 404);

    // Count users with more points
    const { count: rank, error: rankError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('points', user.points);

    if (rankError) throw new AppError('Failed to calculate rank', 500);

    res.json({
      rank: (rank || 0) + 1,
      points: user.points
    });
  } catch (error) {
    next(error);
  }
};

// Get leaderboard by hobby
export const getHobbyLeaderboard = async (req, res, next) => {
  try {
    const { hobbyId } = req.params;
    const { limit = 50 } = req.query;

    // Get users who have this hobby
    const { data: userHobbies, error } = await supabaseAdmin
      .from('user_hobbies')
      .select(`
        user:users(
          id,
          username,
          full_name,
          avatar_url,
          points,
          level
        )
      `)
      .eq('hobby_id', hobbyId)
      .order('user.points', { ascending: false })
      .limit(limit);

    if (error) throw new AppError('Failed to fetch hobby leaderboard', 500);

    const leaderboard = userHobbies.map((uh, index) => ({
      ...uh.user,
      rank: index + 1
    }));

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
};
