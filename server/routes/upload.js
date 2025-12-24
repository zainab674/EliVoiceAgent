import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Sanitize filename to prevent issues
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// @desc    Upload file(s)
// @route   POST /api/v1/upload
// @access  Public (or Protected if middleware added)
router.post('/', upload.array('files'), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const files = req.files.map(file => ({
            name: file.originalname,
            path: `/uploads/${file.filename}`, // Relative path for frontend access
            type: file.mimetype,
            size: file.size,
            uploadedAt: new Date()
        }));

        res.json({
            message: 'Files uploaded successfully',
            files
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server upload error' });
    }
});

export default router;
