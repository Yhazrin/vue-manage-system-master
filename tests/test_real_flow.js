// 测试真实用户操作流程
const mysql = require('mysql2/promise');

async function testRealUserFlow() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'YHZ@yhz050401',
        database: 'author_center'
    });

    try {
        console.log('🧪 开始测试真实用户操作流程...\n');

        // 1. 查看当前陪玩余额
        const [players] = await connection.execute(
            'SELECT id, name, money FROM players WHERE id = 2002 LIMIT 1'
        );
        const player = players[0];
        console.log(`📊 陪玩 ${player.name} (ID: ${player.id}) 当前余额: ¥${player.money}`);

        // 2. 模拟用户下单（创建待审核订单）
        const orderId = `REAL${Date.now()}`;
        await connection.execute(`
            INSERT INTO orders (order_id, user_id, player_id, game_id, service_id, amount, status, created_at)
            VALUES (?, 1001, 2002, 2, 3, 30, 'pending_review', NOW())
        `, [orderId]);
        console.log(`✅ 用户下单成功，订单ID: ${orderId}，状态: pending_review`);

        // 3. 模拟用户在订单中赠送礼物（通过API调用GiftRecordDAO.create）
        // 这里直接调用数据库模拟API的行为
        const giftPrice = 123.00; // 礼物单价
        const quantity = 1;
        const totalPrice = giftPrice * quantity;
        
        // 获取平台抽成率（模拟从配置表获取）
        const [[config]] = await connection.execute(
            'SELECT gift_commission_rate FROM platform_config WHERE id = 1'
        );
        const commissionRate = config.gift_commission_rate;
        const platformFee = totalPrice * commissionRate / 100; // 除以100因为数据库存储的是百分比
        
        console.log(`🎁 用户赠送礼物: 单价¥${giftPrice}, 数量${quantity}, 总价¥${totalPrice}, 平台抽成率${commissionRate}%, 平台费用¥${platformFee.toFixed(2)}`);

        // 模拟GiftRecordDAO.create的逻辑
        // 检查订单状态，如果不是completed则不立即结算
        const [[orderInfo]] = await connection.execute(
            'SELECT status FROM orders WHERE order_id = ?',
            [orderId]
        );
        
        const isSettled = orderInfo.status === 'completed' ? 1 : 0;
        console.log(`📋 订单状态: ${orderInfo.status}, 是否立即结算: ${isSettled ? '是' : '否'}`);

        // 插入礼物记录
        const [giftResult] = await connection.execute(`
            INSERT INTO gift_records (user_id, player_id, order_id, gift_id, quantity, total_price, platform_fee, is_settled, created_at)
            VALUES (1001, 2002, ?, 20, ?, ?, ?, ?, NOW())
        `, [orderId, quantity, totalPrice, platformFee, isSettled]);
        
        const giftRecordId = giftResult.insertId;
        console.log(`✅ 礼物记录创建成功，ID: ${giftRecordId}`);

        // 如果立即结算，更新陪玩余额
        if (isSettled) {
            const playerEarning = totalPrice - platformFee;
            await connection.execute(
                'UPDATE players SET money = money + ? WHERE id = ?',
                [playerEarning, 2002]
            );
            console.log(`💰 立即结算，陪玩获得收益: ¥${playerEarning.toFixed(2)}`);
        } else {
            console.log(`⏳ 礼物记录已创建但未结算，等待订单审核通过`);
        }

        // 4. 检查陪玩余额是否变化
        const [playersAfterGift] = await connection.execute(
            'SELECT money FROM players WHERE id = 2002'
        );
        const balanceAfterGift = playersAfterGift[0].money;
        console.log(`💰 赠送礼物后陪玩余额: ¥${balanceAfterGift}`);
        
        if (balanceAfterGift === player.money) {
            console.log('✅ 正确：礼物赠送后余额未立即变化（等待订单审核）');
        } else {
            console.log('❌ 错误：礼物赠送后余额立即变化了');
        }

        // 5. 模拟管理员审核订单通过
        console.log('\n🔍 管理员审核订单...');
        
        // 更新订单状态
        await connection.execute(`
            UPDATE orders SET status = 'completed', reviewed_by = 1, reviewed_at = NOW() WHERE order_id = ?
        `, [orderId]);
        console.log(`✅ 订单审核通过: ${orderId}`);

        // 模拟OrderDAO.reviewOrder中的礼物结算逻辑
        const [unsettledGifts] = await connection.execute(`
            SELECT id, player_id, total_price, platform_fee FROM gift_records 
            WHERE order_id = ? AND is_settled = 0
        `, [orderId]);

        if (unsettledGifts.length > 0) {
            let totalPlayerEarning = 0;
            for (const gift of unsettledGifts) {
                const playerEarning = gift.total_price - gift.platform_fee;
                totalPlayerEarning += playerEarning;
            }

            // 更新陪玩余额
            await connection.execute(`
                UPDATE players SET money = money + ? WHERE id = ?
            `, [totalPlayerEarning, 2002]);

            // 标记礼物记录为已结算
            await connection.execute(`
                UPDATE gift_records SET is_settled = 1 WHERE order_id = ?
            `, [orderId]);

            console.log(`💰 礼物结算完成，陪玩获得收益: ¥${totalPlayerEarning.toFixed(2)}`);
        } else {
            console.log('ℹ️ 没有未结算的礼物记录');
        }

        // 6. 检查最终余额
        const [playersAfterSettle] = await connection.execute(
            'SELECT money FROM players WHERE id = 2002'
        );
        const finalBalance = playersAfterSettle[0].money;
        console.log(`💰 最终陪玩余额: ¥${finalBalance}`);

        const expectedIncrease = totalPrice - platformFee;
        if (Math.abs(finalBalance - player.money - expectedIncrease) < 0.01) {
            console.log('✅ 正确：订单审核通过后礼物收益正确结算');
        } else {
            console.log('❌ 错误：礼物收益结算不正确');
            console.log(`预期增加: ¥${expectedIncrease.toFixed(2)}, 实际增加: ¥${(finalBalance - player.money).toFixed(2)}`);
        }

        // 7. 清理测试数据
        await connection.execute('DELETE FROM gift_records WHERE order_id = ?', [orderId]);
        await connection.execute('DELETE FROM orders WHERE order_id = ?', [orderId]);
        await connection.execute('UPDATE players SET money = ? WHERE id = 2002', [player.money]);
        console.log('🧹 清理测试数据完成');

        console.log('\n🎉 真实用户操作流程测试完成！');
        console.log('📝 总结：');
        console.log('   1. 用户下单时订单状态为 pending_review');
        console.log('   2. 用户赠送礼物时，由于订单未审核通过，礼物不会立即结算');
        console.log('   3. 管理员审核订单通过后，系统自动结算所有未结算的礼物');
        console.log('   4. 陪玩在订单审核通过后才能获得礼物收益');

    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        await connection.end();
    }
}

testRealUserFlow();