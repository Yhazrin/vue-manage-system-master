// utils/loginHandler.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import { signToken } from '../middleware/auth';

/**
 * 通用登录处理函数
 * @param findUser 从DAO查询用户的方法（根据手机号）
 * @param updateLastLogin 更新最后登录时间的方法
 * @param role 角色（user/player/manager），用于签发token
 */
export const createLoginHandler = (
    findUser: (phone: string) => Promise<any>, // 传入DAO的查询方法
    updateLastLogin: (id: number) => Promise<void>, // 更新最后登录时间的方法
    role: string
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 验证请求参数
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { phone_num, passwd } = req.body;
            // 调用传入的DAO方法查询用户
            const user = await findUser(phone_num);
            if (!user) {
                return res.status(404).json({ success: false, error: `${role}不存在` });
            }

            // 验证密码
            const match = await bcrypt.compare(passwd, user.passwd);
            if (!match) {
                return res.status(401).json({ success: false, error: '密码错误' });
            }

            // 检查用户封禁状态
            if (user.status === 0 || user.status === false) {
                return res.status(403).json({ 
                    success: false, 
                    error: '账号已被封禁，请联系客服', 
                    banned: true 
                });
            }

            // 更新最后登录时间
            await updateLastLogin(user.id);

            // 签发对应角色的token，对于管理员统一使用 admin 角色
            let tokenRole = user.role || role;
            if (role === 'manager') {
                // 对于管理员登录，无论数据库中是什么角色，都统一使用 admin
                tokenRole = 'admin';
            }
            console.log('🔍 登录调试信息:');
            console.log('- 数据库中的用户角色:', user.role);
            console.log('- 传入的默认角色:', role);
            console.log('- Token中使用的角色:', tokenRole);
            console.log('- 用户状态:', user.status);
            const token = signToken(user.id, user.phone_num, tokenRole);
            res.json({ success: true, token, user: user });
        } catch (err) {
            next(err);
        }
    };
};