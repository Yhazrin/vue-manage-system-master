// utils/upload.ts
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 删除旧文件的工具函数
 * @param filePath 文件路径
 */
export function deleteOldFile(filePath: string): void {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`已删除旧文件: ${filePath}`);
        } catch (error) {
            console.error(`删除文件失败: ${filePath}`, error);
        }
    }
}

/**
 * 根据相对路径删除文件
 * @param relativePath 相对路径（如：uploads/player/photos/xxx.jpg）
 */
export function deleteFileByRelativePath(relativePath: string): void {
    if (!relativePath) return;
    
    // 构建完整的文件路径
    const fullPath = path.join(__dirname, '../..', relativePath);
    deleteOldFile(fullPath);
}

/**
 * 规范化 Windows 路径到 Web 路径：
 *  - 全部转成 '/' 分隔
 *  - 丢掉 drive 盘符和前面多余的目录，只保留 uploads/ 下的相对路径
 */
export function normalizePath(fullPath: string): string {
    // 1. 先将所有反斜杠转为斜杠（处理Windows路径）
    let p = fullPath.replace(/\\/g, '/');
    // 2. 移除可能的重复斜杠（如"uploads//player"转为"uploads/player"）
    p = p.replace(/\/+/g, '/');
    // 3. 提取uploads/及其后面的路径（确保从uploads开始）
    const idx = p.indexOf('uploads/');
    if (idx !== -1) {
        return p.substring(idx);
    }
    // 兜底：如果没有uploads/，则返回文件名（避免无效路径）
    return path.basename(p);
}

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
            
            // 使用backend/server/uploads文件夹（与静态文件服务配置一致）
            const baseUploadsPath = path.join(__dirname, '../../uploads');

            // 新增gift类型处理
            if (type === 'gift') {
                dir = path.join(baseUploadsPath, 'gift/images/'); // 礼物图片专用目录
            }
            // 新增game类型处理 - 存储到后端uploads目录
            else if (type === 'game') {
                dir = path.join(baseUploadsPath, 'game/images/'); // 游戏图片存储到后端uploads目录
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
                dir = path.join(baseUploadsPath, `player/${subDir}`);
                // 完整路径示例：
                // - 头像：项目根目录/uploads/player/photos/
                // - 二维码：项目根目录/uploads/player/qrs/
                // - 录音：项目根目录/uploads/player/voices/
            } else {
                // user和manager只需要头像目录（统一存到各自的photos子目录）
                dir = path.join(baseUploadsPath, `${type}/photos/`);
                // 路径：项目根目录/uploads/user/photos/ 或 项目根目录/uploads/manager/photos/
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
        const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        // 录音文件允许的格式（根据实际需求调整）
        const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'];

        // 对player的录音文件单独判断格式
        if (type === 'player' && file.fieldname === 'voice') {
            if (audioTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`录音仅支持${audioTypes.join('、')}格式`));
            }
        } else {
            // 其他情况（头像、二维码、游戏图片、礼物图片）按图片格式判断
            if (imageTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`图片仅支持${imageTypes.join('、')}格式`));
            }
        }
    };

    // 根据类型设置文件大小限制
    let fileSizeLimit: number;
    if (type === 'player') {
        fileSizeLimit = 10 * 1024 * 1024; // 10MB（包含录音文件）
    } else {
        fileSizeLimit = 10 * 1024 * 1024; // 10MB（图片文件）
    }

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: fileSizeLimit
        }
    });
};


// 预创建各路由的上传实例（直接调用即可）
export const userUpload = createUpload('user');
export const playerUpload = createUpload('player');
export const managerUpload = createUpload('manager');
// 新增礼物图片上传实例
export const giftUpload = createUpload('gift');
// 新增游戏图片上传实例
export const gameUpload = createUpload('game');

// 调试信息
console.log('upload.ts: gameUpload created:', gameUpload);