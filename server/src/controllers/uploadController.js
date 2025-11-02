import path from 'path';
import { fileURLToPath } from 'url';

export const handleUpload = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const relativePath = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: relativePath });
};
