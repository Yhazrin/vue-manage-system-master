// utils/loginHandler.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import { signToken } from '../middleware/auth';

/**
 * 通用登录处理函数
 * @param findUser 从DAO查询用户的方法（根据手机号）
 * @param role 角色（user/player/manager），用于签发token
 */
export const createLoginHandler = (
    findUser: (phone: string) => Promise<any>, // 传入DAO的查询方法
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

            // 签发对应角色的token
            const token = signToken(user.id, user.phone_num, role, user.authority);
            res.json({ success: true, token, manager: user });
        } catch (err) {
            next(err);
        }
    };
};