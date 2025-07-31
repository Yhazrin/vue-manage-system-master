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
            let dir: string;

            // 新增gift类型处理
            if (type === 'gift') {
                dir = `uploads/gift/images/`; // 礼物图片专用目录
            }

            // 特殊处理：player类型区分头像、二维码和录音目录
            else if (type === 'player') {
                // 根据文件字段名（fieldname）判断存储子目录
                let subDir: string;
                switch (file.fieldname) {
                    case 'QR_img':
                        subDir = 'qrs/'; // 二维码
                        break;
                    case 'voice':
                        subDir = 'voices/'; // 录音文件
                        break;
                    default:
                        subDir = 'photos/'; // 默认头像（photo_img）
                }
                dir = `uploads/player/${subDir}`;
                // 完整路径示例：
                // - 头像：uploads/player/photos/
                // - 二维码：uploads/player/qrs/
                // - 录音：uploads/player/voices/
            } else {
                // user和manager只需要头像目录（统一存到各自的photos子目录）
                dir = `uploads/${type}/photos/`;
                // 路径：uploads/user/photos/ 或 uploads/manager/photos/
            }
            ensureDir(dir);
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            // 文件名：时间戳+原文件名（清洗特殊字符）
            const safeName = file.originalname.replace(/[^a-zA-Z0-9_.]/g, '');
            cb(null, `${Date.now()}-${safeName}`);
        }
    });

    // 文件过滤：根据类型区分允许的文件格式
    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        // 图片类型（头像、二维码）允许的格式
        const imageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        // 录音文件允许的格式（根据实际需求调整）
        const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'];

        // 大小限制（字节）
        const imageSizeLimit = 5 * 1024 * 1024; // 5MB
        const audioSizeLimit = 10 * 1024 * 1024; // 10MB

        // 检查文件大小
        if (type === 'player' && file.fieldname === 'voice') {
            if (file.size > audioSizeLimit) {
                cb(new Error(`录音文件大小不能超过${audioSizeLimit / 1024 / 1024}MB`));
                return;
            }
        } else {
            if (file.size > imageSizeLimit) {
                cb(new Error(`图片文件大小不能超过${imageSizeLimit / 1024 / 1024}MB`));
                return;
            }
        }

        // 对player的录音文件单独判断格式
        if (type === 'player' && file.fieldname === 'voice') {
            if (audioTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`录音仅支持${audioTypes.join('、')}格式`));
            }
        } else {
            // 其他情况（头像、二维码）按图片格式判断
            if (imageTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`图片仅支持${imageTypes.join('、')}格式`));
            }
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: Infinity // 这里不限制大小，具体在fileFilter中处理
        }
    });
};


// 预创建各路由的上传实例（直接调用即可）
export const userUpload = createUpload('user');
export const playerUpload = createUpload('player');
export const managerUpload = createUpload('manager');
// 新增礼物图片上传实例
export const giftUpload = createUpload('gift');

// 将 Windows 路径中的反斜杠统一转换为正斜杠，便于前端加载
export const normalizePath = (p: string) => p.replace(/\\/g, '/');