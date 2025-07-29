"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorityValidator = exports.nameValidator = exports.passwordValidator = exports.phoneUniqueValidator = exports.phoneValidator = void 0;
// utils/validators.ts
const express_validator_1 = require("express-validator");
const UserDao_1 = require("../dao/UserDao");
const PlayerDao_1 = require("../dao/PlayerDao");
const ManagerDao_1 = require("../dao/ManagerDao");
// 手机号格式验证（通用）
exports.phoneValidator = (0, express_validator_1.body)('phone_num')
    .isMobilePhone('zh-CN')
    .withMessage('手机号格式不正确');
// 手机号唯一性验证（根据角色区分）
const phoneUniqueValidator = (role) => {
    return (0, express_validator_1.body)('phone_num').custom((value) => __awaiter(void 0, void 0, void 0, function* () {
        let exists = false;
        switch (role) {
            case 'user':
                exists = !!(yield UserDao_1.UserDAO.findByPhone(value));
                break;
            case 'player':
                exists = !!(yield PlayerDao_1.PlayerDAO.findByPhoneNum(value));
                break;
            case 'manager':
                exists = !!(yield ManagerDao_1.ManagerDAO.findByPhone(value));
                break;
        }
        if (exists)
            throw new Error('该手机号已被注册');
        return true;
    }));
};
exports.phoneUniqueValidator = phoneUniqueValidator;
// 密码验证（通用：长度+复杂度）
exports.passwordValidator = (0, express_validator_1.body)('passwd')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('密码必须包含字母和数字');
// 用户名验证（通用：长度限制）
exports.nameValidator = (0, express_validator_1.body)('name')
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 2, max: 20 })
    .withMessage('用户名长度必须在2-20个字符之间');
// 权限等级验证（管理员专用）
exports.authorityValidator = (0, express_validator_1.body)('authority')
    .isInt({ min: 1, max: 3 })
    .withMessage('权限等级必须是1-3之间的整数');
// // ID参数验证（通用：必须为数字）
// export const idParamValidator = body('id')
//     .optional()
//     .isInt({ min: 1 })
//     .withMessage('ID必须为正整数');
