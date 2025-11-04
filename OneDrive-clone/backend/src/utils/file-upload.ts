import { StorageService } from '../services/storage.service';
import fs from 'fs/promises';

// Extended Multer file type to handle both disk and memory storage
export type MulterFile = Express.Multer.File & {
  buffer?: Buffer;
  path?: string;
};

export async function uploadFileToStorage(
  userId: string,
  fileId: string,
  file: MulterFile,
  mimeType?: string
): Promise<string> {
  // In Vercel/serverless environments, use buffer from memory storage
  if (process.env.VERCEL && file.buffer) {
    return StorageService.uploadFile(userId, fileId, file.buffer, mimeType);
  }
  
  // In local development, use file path from disk storage
  if (file.path) {
    return StorageService.uploadFileFromPath(userId, fileId, file.path, mimeType);
  }
  
  throw new Error('No file data available for upload');
}

export async function cleanupTempFile(file: MulterFile): Promise<void> {
  // Only clean up disk storage files
  if (!process.env.VERCEL && file?.path) {
    try {
      await fs.unlink(file.path);
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
}