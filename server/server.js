import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import reportRoutes from './routes/reports.js';
import chatRoutes from './routes/chats.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Code to enable CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup public uploads folder
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Setup multer storage for secure product image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|mp4|webm|ogg|mov|avi/i;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp, gif) and videos (mp4, webm, ogg, mov, avi) are allowed'));
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for media
});

// Single or multiple file upload fallback handler supporting images and videos under any field name
app.post('/api/upload', (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const file = req.files[0];
    const fileUrl = `http://localhost:${PORT}/uploads/${file.filename}`;
    const isVideo = /mp4|webm|ogg|mov|avi/i.test(path.extname(file.originalname).toLowerCase());
    res.json({ 
      url: fileUrl, 
      type: isVideo ? 'video' : 'image', 
      image_url: fileUrl // Compatibility with legacy calls
    });
  });
});

// Register Api Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chats', chatRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('TechCentral API is running...');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'An internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Initialize database then start server
const start = async () => {
  try {
    console.log('Initializing database...');
    await initDb();
    
    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('Fatal: Failed to start the server database:', err);
    process.exit(1);
  }
};

start();

export default app;
