"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
exports.signToken = signToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
// 验证 JWT 并挂载用户信息到 req.user
function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: '未提供 token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = { id: payload.id, phone_num: payload.phone_num, role: payload.role, authority: payload.authority };
        next();
    }
    catch (err) {
        return res.status(401).json({ success: false, error: '无效的 token' });
    }
}
// 签发 JWT Token
function signToken(userId, phoneNum, role, authority) {
    const payload = { id: userId, phone_num: phoneNum, role, authority };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '24h' }); // 设置 24 小时过期
}
