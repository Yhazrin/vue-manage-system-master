import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Select, Space, Tag, Modal, message, Descriptions, Timeline, Input } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import Header from '@/components/Header';
import { 
  getUnifiedWithdrawals, 
  approveWithdrawal, 
  rejectWithdrawal,
  UnifiedWithdrawalRequest,
  UnifiedProcessRecord 
} from '@/services/unifiedWithdrawalService';

const { Option } = Select;
const { TextArea } = Input;

const UnifiedWithdrawalManagement: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<UnifiedWithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<UnifiedWithdrawalRequest | null>(null);
  const [processRecords, setProcessRecords] = useState<UnifiedProcessRecord[]>([]);
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
  const [processRemark, setProcessRemark] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter, typeFilter]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const data = await getUnifiedWithdrawals(statusFilter, typeFilter);
      setWithdrawals(data);
    } catch (error) {
      message.error('获取提现记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record: UnifiedWithdrawalRequest) => {
    setSelectedWithdrawal(record);
    setDetailModalVisible(true);
  };

  const handleProcess = (record: UnifiedWithdrawalRequest, action: 'approve' | 'reject') => {
    setSelectedWithdrawal(record);
    setProcessAction(action);
    setProcessRemark('');
    setProcessModalVisible(true);
  };

  const confirmProcess = async () => {
    if (!selectedWithdrawal) return;

    try {
      if (processAction === 'approve') {
        await approveWithdrawal(selectedWithdrawal.id, selectedWithdrawal.applicantType, processRemark);
        message.success('提现申请已批准');
      } else {
        await rejectWithdrawal(selectedWithdrawal.id, selectedWithdrawal.applicantType, processRemark);
        message.success('提现申请已拒绝');
      }
      setProcessModalVisible(false);
      fetchWithdrawals();
    } catch (error) {
      message.error(`处理失败: ${error}`);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      pending: { color: 'orange', text: '待处理' },
      approved: { color: 'green', text: '已批准' },
      rejected: { color: 'red', text: '已拒绝' },
      completed: { color: 'blue', text: '已完成' }
    };
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const typeMap = {
      player: { color: 'blue', text: '陪玩' },
      customer_service: { color: 'purple', text: '客服' }
    };
    const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '申请人类型',
      dataIndex: 'applicantType',
      key: 'applicantType',
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
    },
    {
      title: '提现金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UnifiedWithdrawalRequest) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-theme-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card title="提现管理" className="shadow-sm">
          <div className="mb-4 flex gap-4">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              placeholder="状态筛选"
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待处理</Option>
              <Option value="approved">已批准</Option>
              <Option value="rejected">已拒绝</Option>
              <Option value="completed">已完成</Option>
            </Select>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 120 }}
              placeholder="类型筛选"
            >
              <Option value="all">全部类型</Option>
              <Option value="player">陪玩</Option>
              <Option value="customer_service">客服</Option>
            </Select>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={fetchWithdrawals}
            >
              刷新
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={withdrawals}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Card>

        {/* 详情模态框 */}
        <Modal
          title="提现申请详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={
            selectedWithdrawal && selectedWithdrawal.status === 'pending' ? (
              <Space>
                <Button onClick={() => setDetailModalVisible(false)}>
                  关闭
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={async () => {
                    if (!selectedWithdrawal) return;
                    try {
                      await approveWithdrawal(selectedWithdrawal.id, selectedWithdrawal.applicantType, '审批通过');
                      message.success('提现申请已批准');
                      setDetailModalVisible(false);
                      fetchWithdrawals();
                    } catch (error) {
                      message.error(`批准失败: ${error}`);
                    }
                  }}
                  style={{ 
                    backgroundColor: 'var(--theme-success)', 
                    borderColor: 'var(--theme-success)',
                    color: 'white'
                  }}
                >
                  批准
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setDetailModalVisible(false);
                    handleProcess(selectedWithdrawal, 'reject');
                  }}
                >
                  拒绝
                </Button>
              </Space>
            ) : (
              <Button onClick={() => setDetailModalVisible(false)}>
                关闭
              </Button>
            )
          }
          width={600}
        >
          {selectedWithdrawal && (
            <Descriptions column={2} bordered>
              <Descriptions.Item label="申请人类型">
                {getTypeTag(selectedWithdrawal.applicantType)}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {selectedWithdrawal.applicantName}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话" span={2}>
                {selectedWithdrawal.applicantPhone || '未提供'}
              </Descriptions.Item>
              <Descriptions.Item label="提现金额">
                ¥{selectedWithdrawal.amount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {new Date(selectedWithdrawal.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedWithdrawal.status)}
              </Descriptions.Item>
              <Descriptions.Item label="处理时间">
                {selectedWithdrawal.processedAt ? 
                  new Date(selectedWithdrawal.processedAt).toLocaleString() : 
                  '未处理'
                }
              </Descriptions.Item>
              <Descriptions.Item label="处理人" span={2}>
                {selectedWithdrawal.processedBy || '未处理'}
              </Descriptions.Item>
              <Descriptions.Item label="申请说明" span={2}>
                {selectedWithdrawal.description || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="处理备注" span={2}>
                {selectedWithdrawal.notes || '无'}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* 处理模态框 */}
        <Modal
          title={`${processAction === 'approve' ? '批准' : '拒绝'}提现申请`}
          open={processModalVisible}
          onOk={confirmProcess}
          onCancel={() => setProcessModalVisible(false)}
          okText="确认"
          cancelText="取消"
        >
          <div className="mb-4">
            <p className="text-theme-text mb-3">确定要{processAction === 'approve' ? '批准' : '拒绝'}这个提现申请吗？</p>
            {selectedWithdrawal && (
              <div className="mt-2 p-3 bg-theme-background rounded-lg border border-theme-border">
                <p className="text-theme-text mb-1"><strong>申请人：</strong>{selectedWithdrawal.applicantName}</p>
                <p className="text-theme-text mb-1"><strong>金额：</strong>¥{selectedWithdrawal.amount.toFixed(2)}</p>
                <p className="text-theme-text"><strong>类型：</strong>{selectedWithdrawal.applicantType === 'player' ? '陪玩' : '客服'}</p>
              </div>
            )}
          </div>
          <div>
            <label className="block mb-2 text-theme-text font-medium">处理备注：</label>
            <TextArea
              value={processRemark}
              onChange={(e) => setProcessRemark(e.target.value)}
              placeholder="请输入处理备注（可选）"
              rows={3}
              style={{
                backgroundColor: 'var(--theme-surface)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
            />
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default UnifiedWithdrawalManagement;