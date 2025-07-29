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
// src/routes/config.route.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const ConfigDao_1 = require("../dao/ConfigDao");
const router = (0, express_1.Router)();
// 权限中间件：仅允许 authority 为 1 的管理员访问
const requireTopManager = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager' || req.user.authority !== 1) {
        return res.status(403).json({
            success: false,
            error: '仅顶级管理员可访问此统计数据'
        });
    }
    next();
};
/**
 * @route  PATCH /api/config/commission
 * @desc   修改平台抽成比例
 * @body   { commission_rate }
 * @access 顶级管理员
 */
router.patch('/commission', auth_1.auth, requireTopManager, (0, express_validator_1.body)('commission_rate').isFloat({ min: 0, max: 100 }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
        const rate = parseFloat(req.body.commission_rate);
        yield ConfigDao_1.ConfigDAO.updateCommissionRate(rate);
        res.json({ success: true, commission_rate: rate });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
