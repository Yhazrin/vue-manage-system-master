// utils/validators.ts
import { body } from 'express-validator';
import { UserDAO } from '../dao/UserDao';
import { PlayerDAO } from '../dao/PlayerDao';
import { ManagerDAO } from '../dao/ManagerDao';

// 手机号格式验证（通用）
export const phoneValidator = body('phone_num')
    .isMobilePhone('zh-CN')
    .withMessage('手机号格式不正确');

// 手机号唯一性验证（根据角色区分）
export const phoneUniqueValidator = (role: 'user' | 'player' | 'manager') => {
    return body('phone_num').custom(async (value) => {
        let exists = false;
        switch (role) {
            case 'user':
                exists = !!await UserDAO.findByPhone(value);
                break;
            case 'player':
                exists = !!await PlayerDAO.findByPhoneNum(value);
                break;
            case 'manager':
                exists = !!await ManagerDAO.findByPhone(value);
                break;
        }
        if (exists) throw new Error('该手机号已被注册');
        return true;
    });
};

// 密码验证（通用：长度+复杂度）
export const passwordValidator = body('passwd')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('密码必须包含字母和数字');

// // ID参数验证（通用：必须为数字）
// export const idParamValidator = body('id')
//     .optional()
//     .isInt({ min: 1 })
//     .withMessage('ID必须为正整数');