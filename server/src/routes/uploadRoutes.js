import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';
import { upload, uploadFile } from '../controllers/uploadController.js';

const router = Router();

router.post('/', requireAuth, upload.single('file'), uploadFile);

router.get('/uploads/:filename', requireAuth, (req, res) => {
  const { filename } = req.params;
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return res.status(400).json({ message: 'Invalid filename' });
  }

  const fullPath = path.resolve('uploads', filename);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'File not found' });

  return res.sendFile(fullPath);
});

export default router;

