import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth.middleware';

// Use memory storage for serverless environments, disk storage for local development
const storage = process.env.VERCEL 
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req: any, file, cb) => {
        const uploadDir = process.env.UPLOAD_PATH || './uploads';
        const userId = req.user?.id || req.user?._id || 'temp';
        const userDir = path.join(uploadDir, userId.toString());
        
        // Create directories only in local development
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }
        
        cb(null, userDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file size
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '104857600'); // 100MB default
  
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB default
  }
});