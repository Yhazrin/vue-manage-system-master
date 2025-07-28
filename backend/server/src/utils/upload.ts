// utils/upload.ts
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// 确保目录存在（防止上传失败）
const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

/**
 * 创建multer上传实例
 * @param type 路由类型（user/player/manager），用于区分存储目录
 */
export const createUpload = (type: string) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            // 目录格式：uploads/[type]/（如uploads/player/）
            const dir = `uploads/${type}/`;
            ensureDir(dir);
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            // 文件名：时间戳+原文件名（清洗特殊字符）
            const safeName = file.originalname.replace(/[^a-zA-Z0-9_.]/g, '');
            cb(null, `${Date.now()}-${safeName}`);
        }
    });

    // 文件过滤：只允许图片类型
    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`仅支持${allowedTypes.join('、')}格式`));
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 } // 限制5MB
    });
};

// 预创建各路由的上传实例（直接调用即可）
export const userUpload = createUpload('user');
export const playerUpload = createUpload('player');
export const managerUpload = createUpload('manager');