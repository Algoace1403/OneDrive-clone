import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/error.middleware.js';
import { v4 as uuidv4 } from 'uuid';

// Get all rewards
export const getRewards = async (req, res, next) => {
  try {
    const { brandId, isActive = true } = req.query;

    let query = supabaseAdmin
      .from('rewards')
      .select(`
        *,
        brand:brands(*)
      `)
      .eq('is_active', isActive);

    if (brandId) query = query.eq('brand_id', brandId);

    const { data: rewards, error } = await query.order('points_required', { ascending: true });

    if (error) throw new AppError('Failed to fetch rewards', 500);

    res.json({ rewards });
  } catch (error) {
    next(error);
  }
};

// Get reward details
export const getRewardById = async (req, res, next) => {
  try {
    const { rewardId } = req.params;

    const { data: reward, error } = await supabaseAdmin
      .from('rewards')
      .select(`
        *,
        brand:brands(*)
      `)
      .eq('id', rewardId)
      .single();

    if (error) throw new AppError('Reward not found', 404);

    res.json({ reward });
  } catch (error) {
    next(error);
  }
};

// Redeem a reward
export const redeemReward = async (req, res, next) => {
  try {
    const { rewardId } = req.params;
    const userId = req.user.id;

    // Get user points
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (userError) throw new AppError('User not found', 404);

    // Get reward details
    const { data: reward, error: rewardError } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('is_active', true)
      .single();

    if (rewardError) throw new AppError('Reward not found', 404);

    // Check if user has enough points
    if (user.points < reward.points_required) {
      throw new AppError('Insufficient points', 400);
    }

    // Check if reward is still available
    if (reward.total_available && reward.total_redeemed >= reward.total_available) {
      throw new AppError('Reward is no longer available', 400);
    }

    // Check if reward is expired
    if (reward.expiry_date && new Date(reward.expiry_date) < new Date()) {
      throw new AppError('Reward has expired', 400);
    }

    // Generate unique coupon code
    const couponCode = `${reward.code || 'QUEST'}-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Create user reward redemption
    const { data: userReward, error: redemptionError } = await supabaseAdmin
      .from('user_rewards')
      .insert({
        user_id: userId,
        reward_id: rewardId,
        coupon_code: couponCode,
        status: 'active'
      })
      .select()
      .single();

    if (redemptionError) throw new AppError('Failed to redeem reward', 500);

    // Deduct points from user
    await supabaseAdmin
      .from('users')
      .update({ points: user.points - reward.points_required })
      .eq('id', userId);

    // Increment total_redeemed
    await supabaseAdmin
      .from('rewards')
      .update({ total_redeemed: reward.total_redeemed + 1 })
      .eq('id', rewardId);

    res.status(201).json({
      message: 'Reward redeemed successfully! 🎉',
      userReward: {
        ...userReward,
        reward
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user's redeemed rewards
export const getMyRewards = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = supabaseAdmin
      .from('user_rewards')
      .select(`
        *,
        reward:rewards(
          *,
          brand:brands(*)
        )
      `)
      .eq('user_id', userId);

    if (status) query = query.eq('status', status);

    const { data: userRewards, error } = await query.order('redeemed_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch rewards', 500);

    res.json({ rewards: userRewards });
  } catch (error) {
    next(error);
  }
};

// Mark reward as used
export const markRewardAsUsed = async (req, res, next) => {
  try {
    const { userRewardId } = req.params;
    const userId = req.user.id;

    const { data: userReward, error } = await supabaseAdmin
      .from('user_rewards')
      .update({
        status: 'used',
        used_at: new Date().toISOString()
      })
      .eq('id', userRewardId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new AppError('Failed to update reward status', 500);

    res.json({
      message: 'Reward marked as used',
      userReward
    });
  } catch (error) {
    next(error);
  }
};
