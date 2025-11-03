import { supabaseAdmin } from '../config/supabase';
import fs from 'fs';

export class StorageService {
  private static readonly BUCKET_NAME = 'files';

  static async createBucketIfNotExists() {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    
    const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(this.BUCKET_NAME, {
        public: false,
        fileSizeLimit: 5368709120, // 5GB
        allowedMimeTypes: null // Allow all file types
      });
    }
  }

  static async uploadFile(userId: string, fileId: string, buffer: Buffer, mimeType?: string) {
    const storagePath = `${userId}/${fileId}`;

    const { data, error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) throw error;
    return data.path;
  }

  static async uploadFileFromPath(userId: string, fileId: string, filePath: string, mimeType?: string) {
    const buffer = await fs.promises.readFile(filePath);
    return this.uploadFile(userId, fileId, buffer, mimeType);
  }

  static async downloadFile(storagePath: string): Promise<Buffer> {
    const { data, error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .download(storagePath);

    if (error) throw error;
    
    const buffer = await data.arrayBuffer();
    return Buffer.from(buffer);
  }

  static async getFileUrl(storagePath: string, expiresIn = 3600, download = false): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn, {
        download: download
      });

    if (error) throw error;
    return data.signedUrl;
  }

  static async deleteFile(storagePath: string) {
    const { error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .remove([storagePath]);

    if (error) throw error;
  }

  static async deleteFiles(storagePaths: string[]) {
    const { error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .remove(storagePaths);

    if (error) throw error;
  }

  static async moveFile(oldPath: string, newPath: string) {
    const { data, error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .move(oldPath, newPath);

    if (error) throw error;
    return data;
  }

  static async copyFile(sourcePath: string, destinationPath: string) {
    // Download the file first
    const buffer = await this.downloadFile(sourcePath);
    
    // Upload to new location
    const { data, error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .upload(destinationPath, buffer, {
        upsert: false
      });

    if (error) throw error;
    return data.path;
  }

  static async getFileMetadata(storagePath: string) {
    const parts = storagePath.split('/');
    const fileName = parts[parts.length - 1];

    const { data, error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .list(parts.slice(0, -1).join('/'), {
        limit: 1,
        search: fileName
      });

    if (error) throw error;
    return data[0];
  }

  static async createPublicUrl(storagePath: string): Promise<string> {
    const { data } = supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  static generateStoragePath(userId: string, fileId: string, version?: number): string {
    if (version) {
      return `${userId}/${fileId}/v${version}`;
    }
    return `${userId}/${fileId}/current`;
  }

  static async purgeDeletedBefore(cutoffIso: string) {
    // This is a mock purge that relies on SupabaseService functions.
    // Import locally to avoid circular import at top-level.
    const { SupabaseService } = await import('./supabase.service');
    const deleted = await SupabaseService.getDeletedOlderThan(cutoffIso);
    for (const f of deleted) {
      try {
        if (f.storage_path) {
          await this.deleteFile(f.storage_path);
        }
        const versions = await SupabaseService.getFileVersions(f.id);
        const paths = versions.map((v: any) => v.storage_path).filter(Boolean);
        if (paths.length) await this.deleteFiles(paths);
        await SupabaseService.permanentlyDeleteFile(f.id, f.owner_id);
      } catch {}
    }
  }
}
