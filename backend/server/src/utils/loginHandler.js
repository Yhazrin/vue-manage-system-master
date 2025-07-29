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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLoginHandler = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
/**
 * 通用登录处理函数
 * @param findUser 从DAO查询用户的方法（根据手机号）
 * @param role 角色（user/player/manager），用于签发token
 */
const createLoginHandler = (findUser, // 传入DAO的查询方法
role) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // 验证请求参数
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
            const { phone_num, passwd } = req.body;
            // 调用传入的DAO方法查询用户
            const user = yield findUser(phone_num);
            if (!user) {
                return res.status(404).json({ success: false, error: `${role}不存在` });
            }
            // 验证密码
            const match = yield bcrypt_1.default.compare(passwd, user.passwd);
            if (!match) {
                return res.status(401).json({ success: false, error: '密码错误' });
            }
            // 签发对应角色的token
            const token = (0, auth_1.signToken)(user.id, user.phone_num, role, user.authority);
            res.json({ success: true, token, manager: user });
        }
        catch (err) {
            next(err);
        }
    });
};
exports.createLoginHandler = createLoginHandler;
