// backend/server/src/routes/withdrawal.route.ts
import { Router, Request, Response, NextFunction } from 'express';
import { WithdrawalDAO } from '../dao/WithdrawalDao';
import { auth, AuthRequest } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';

console.log('🔥🔥🔥 withdrawal.route.ts 文件被加载了！🔥🔥🔥 - 完整版本');

const router = Router();

/**
 * @route   GET /api/withdrawals
 * @desc    获取提现记录列表
 * @access  需要登录
 */
router.get('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const status = req.query.status as string;

        let result;
        
        // 如果是陪玩，只能查看自己的提现记录
        if (req.user?.role === 'player') {
            result = await WithdrawalDAO.findByPlayerId(req.user.id, page, pageSize, status);
            res.json({
                success: true,
                withdrawals: result.list,
                total: result.total,
                page,
                pageSize
            });
        } 
        // 如果是管理员，可以查看所有提现记录
        else if (req.user?.role === 'manager') {
            result = await WithdrawalDAO.findAll(page, pageSize, status as any);
            res.json({
                success: true,
                withdrawals: result.withdrawals,
                total: result.total,
                page,
                pageSize
            });
        } 
        else {
            res.status(403).json({ success: false, error: '无权限访问' });
        }
    } catch (error) {
        console.error('获取提现记录失败:', error);
        next(error);
    }
});

/**
 * @route   POST /api/withdrawals
 * @desc    创建提现申请
 * @access  仅陪玩可访问
 */
router.post('/', 
    auth,
    [
        body('amount').isNumeric().withMessage('提现金额必须是数字'),
        body('amount').custom(value => {
            if (value <= 0) {
                throw new Error('提现金额必须大于0');
            }
            return true;
        }),
        body('withdrawal_id').notEmpty().withMessage('提现ID不能为空')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // 验证输入
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: '输入验证失败',
                    details: errors.array()
                });
            }

            // 只有陪玩可以申请提现
            if (req.user?.role !== 'player') {
                return res.status(403).json({ success: false, error: '仅陪玩可申请提现' });
            }

            const { withdrawal_id, amount } = req.body;
            const player_id = req.user.id;

            // 创建提现记录
            await WithdrawalDAO.create({
                withdrawal_id,
                player_id,
                amount: parseFloat(amount)
            });

            // 获取创建的记录
            const withdrawal = await WithdrawalDAO.findById(withdrawal_id);

            res.json({
                success: true,
                message: '提现申请已提交',
                withdrawal
            });
        } catch (error) {
            console.error('创建提现申请失败:', error);
            next(error);
        }
    }
);

/**
 * @route   PUT /api/withdrawals/:id/status
 * @desc    更新提现状态（批准/拒绝）
 * @access  仅管理员可访问
 */
router.put('/:id/status',
    auth,
    [
        param('id').notEmpty().withMessage('提现ID不能为空'),
        body('status').isIn(['已批准', '已拒绝', '已打款']).withMessage('状态值无效'),
        body('notes').optional().isString().withMessage('备注必须是字符串')
    ],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // 验证输入
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: '输入验证失败',
                    details: errors.array()
                });
            }

            // 只有管理员可以更新提现状态
            if (req.user?.role !== 'manager') {
                return res.status(403).json({ success: false, error: '仅管理员可操作' });
            }

            const { id } = req.params;
            const { status, notes } = req.body;

            // 检查提现记录是否存在
            const withdrawal = await WithdrawalDAO.findById(id);
            if (!withdrawal) {
                return res.status(404).json({ success: false, error: '提现记录不存在' });
            }

            // 更新状态
            const updated = await WithdrawalDAO.updateStatus(id, status, notes);
            if (!updated) {
                return res.status(500).json({ success: false, error: '更新失败' });
            }

            // 获取更新后的记录
            const updatedWithdrawal = await WithdrawalDAO.findById(id);

            res.json({
                success: true,
                message: `提现申请已${status}`,
                withdrawal: updatedWithdrawal
            });
        } catch (error) {
            console.error('更新提现状态失败:', error);
            next(error);
        }
    }
);

/**
 * @route   GET /api/withdrawals/stats
 * @desc    获取提现统计信息
 * @access  仅管理员可访问
 */
router.get('/stats', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 只有管理员可以查看统计信息
        if (req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, error: '仅管理员可访问' });
        }

        // 这里可以添加统计查询逻辑
        // 暂时返回空统计
        res.json({
            success: true,
            stats: {
                totalWithdrawals: 0,
                pendingCount: 0,
                approvedCount: 0,
                rejectedCount: 0,
                totalAmount: 0,
                totalFees: 0
            }
        });
    } catch (error) {
        console.error('获取提现统计失败:', error);
        next(error);
    }
});

/**
 * @route   GET /api/withdrawals/:id
 * @desc    获取单个提现记录详情
 * @access  需要登录
 */
router.get('/:id', 
    auth,
    [param('id').notEmpty().withMessage('提现ID不能为空')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // 验证输入
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: '输入验证失败',
                    details: errors.array()
                });
            }

            const { id } = req.params;
            const withdrawal = await WithdrawalDAO.findById(id);

            if (!withdrawal) {
                return res.status(404).json({ success: false, error: '提现记录不存在' });
            }

            // 权限检查：陪玩只能查看自己的记录，管理员可以查看所有记录
            if (req.user?.role === 'player' && withdrawal.player_id !== req.user.id) {
                return res.status(403).json({ success: false, error: '无权限查看此记录' });
            }

            res.json({
                success: true,
                withdrawal
            });
        } catch (error) {
            console.error('获取提现记录详情失败:', error);
            next(error);
        }
    }
);

/**
 * @route   GET /api/withdrawals/:id/records
 * @desc    获取提现处理记录
 * @access  需要登录
 */
router.get('/:id/records', 
    auth,
    [param('id').notEmpty().withMessage('提现ID不能为空')],
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // 验证输入
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: '输入验证失败',
                    details: errors.array()
                });
            }

            const { id } = req.params;
            const withdrawal = await WithdrawalDAO.findById(id);

            if (!withdrawal) {
                return res.status(404).json({ success: false, error: '提现记录不存在' });
            }

            // 权限检查：陪玩只能查看自己的记录，管理员可以查看所有记录
            if (req.user?.role === 'player' && withdrawal.player_id !== req.user.id) {
                return res.status(403).json({ success: false, error: '无权限查看此记录' });
            }

            // 返回处理记录（这里简化处理，实际可能需要单独的处理记录表）
            const records = [{
                id: withdrawal.withdrawal_id,
                withdrawalId: withdrawal.withdrawal_id,
                action: withdrawal.status === '待审核' ? '提交申请' : 
                       withdrawal.status === '已批准' ? '批准申请' : '拒绝申请',
                timestamp: withdrawal.updated_at || withdrawal.created_at,
                operator: withdrawal.status === '待审核' ? '系统' : '管理员',
                notes: withdrawal.notes || ''
            }];

            res.json({
                success: true,
                records
            });
        } catch (error) {
            console.error('获取提现处理记录失败:', error);
            next(error);
        }
    }
);

// 保留测试路由
router.get('/test', (req, res) => {
    console.log('🧪 测试路由被调用');
    res.json({ success: true, message: '测试路由工作正常' });
});

export default router;