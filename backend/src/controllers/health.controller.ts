import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

export const healthController = {
  async details(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary: any = { ok: true, time: new Date().toISOString() };

      // Supabase config presence
      summary.supabase = {
        urlSet: !!process.env.SUPABASE_URL,
        anonKeySet: !!process.env.SUPABASE_ANON_KEY,
        serviceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      };

      // Storage buckets
      try {
        const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
        if (error) throw error;
        const filesBucket = (buckets || []).some((b) => b.name === 'files');
        summary.storage = { ok: true, bucketsCount: buckets?.length || 0, filesBucket };
      } catch (e: any) {
        summary.storage = { ok: false, error: e?.message };
        summary.ok = false;
      }

      // DB connectivity
      try {
        const { error } = await supabaseAdmin.from('users').select('id').limit(1);
        if (error) throw error;
        summary.database = { ok: true };
      } catch (e: any) {
        summary.database = { ok: false, error: e?.message };
        summary.ok = false;
      }

      res.json(summary);
    } catch (error) {
      next(error);
    }
  },
};

