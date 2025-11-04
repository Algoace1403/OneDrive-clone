import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../config/multer.config';
import {
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile,
  restoreFile,
  permanentlyDelete,
  toggleFavorite,
  renameFile,
  moveFile,
  copyFile,
  getFileVersions,
  uploadNewVersion,
  restoreVersion,
  previewFile,
  getThumbnail,
  createFolder,
  getFolderPath,
  getVersionPreviewUrl,
  getVersionDownloadUrl,
  getRecentFiles,
  getFavorites,
  getShared,
  getSharedByMe,
  getTrash,
  shareFile,
  generateShareLink,
  getFileShares,
  removeFileShare,
  getShareCounts,
  getFavoriteFlags,
  getFilesMeta
} from '../controllers/file.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// File operations
router.post('/upload', upload.single('file'), uploadFile);
router.post('/folder', createFolder);
router.get('/', getFiles);
// Frontend alias: support /files/search?q=
router.get('/search', getFiles);
router.get('/recent', getRecentFiles);
router.get('/favorites', getFavorites);
router.get('/shared', getShared);
router.get('/shared/by-me', getSharedByMe);
router.get('/trash', getTrash);
// Share counts for a list of file ids
router.get('/shares/counts', getShareCounts);
// Favorite flags for a list of file ids
router.get('/favorites/check', getFavoriteFlags);
// Combined meta: share counts + favorite flags
router.get('/meta', getFilesMeta);
// Breadcrumb path for folders
router.get('/folders/:id/path', getFolderPath);
router.get('/:id/download', downloadFile);
router.get('/:id/preview', previewFile);
router.get('/:id/thumbnail', getThumbnail);
router.get('/:id/versions/:versionNumber/preview', getVersionPreviewUrl);
router.get('/:id/versions/:versionNumber/download', getVersionDownloadUrl);
router.patch('/:id/rename', renameFile);
router.delete('/:id', deleteFile);
router.post('/:id/restore', restoreFile);
router.delete('/:id/permanent', permanentlyDelete);
router.patch('/:id/favorite', toggleFavorite);
router.post('/:id/move', moveFile);
router.post('/:id/copy', copyFile);

// Version operations
router.get('/:id/versions', getFileVersions);
router.post('/:id/versions', upload.single('file'), uploadNewVersion);
router.post('/:id/versions/:versionNumber/restore', restoreVersion);

// Sharing operations
router.post('/:id/share', shareFile);
router.post('/:id/share/link', generateShareLink);
router.get('/:id/shares', getFileShares);
router.delete('/shares/:shareId', removeFileShare);
// Manual purge endpoint
router.post('/trash/purge', async (req, res, next) => {
  try {
    const cutoffDays = parseInt((req.query.days as string) || process.env.TRASH_RETENTION_DAYS || '30');
    const cutoff = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000).toISOString();
    const { StorageService } = await import('../services/storage.service');
    await StorageService.purgeDeletedBefore(cutoff);
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
