import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/error.middleware.js';

// Get all hobbies
export const getHobbies = async (req, res, next) => {
  try {
    const { data: hobbies, error } = await supabaseAdmin
      .from('hobbies')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new AppError('Failed to fetch hobbies', 500);

    res.json({ hobbies });
  } catch (error) {
    next(error);
  }
};

// Get hobby details with stats
export const getHobbyById = async (req, res, next) => {
  try {
    const { hobbyId } = req.params;

    const { data: hobby, error } = await supabaseAdmin
      .from('hobbies')
      .select('*')
      .eq('id', hobbyId)
      .single();

    if (error) throw new AppError('Hobby not found', 404);

    // Get quests count
    const { count: questsCount } = await supabaseAdmin
      .from('quests')
      .select('*', { count: 'exact', head: true })
      .eq('hobby_id', hobbyId)
      .eq('is_active', true);

    // Get participants count
    const { count: participantsCount } = await supabaseAdmin
      .from('user_hobbies')
      .select('*', { count: 'exact', head: true })
      .eq('hobby_id', hobbyId);

    res.json({
      hobby: {
        ...hobby,
        questsCount: questsCount || 0,
        participantsCount: participantsCount || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
