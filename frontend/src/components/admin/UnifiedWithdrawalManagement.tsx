import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Input,
  message,
  Tabs,
  Select,
  Row,
  Col,
  Statistic,
  Typography,
  Descriptions,
  Badge,
  Tooltip,
  DatePicker,
  Form
} from 'antd';
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  FilterOutlined,
  UserOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  UnifiedWithdrawalRequest,
  UnifiedProcessRecord,
  getUnifiedWithdrawalRequests,
  getUnifiedWithdrawalProcessRecords,
  approvePlayerWithdrawal,
  rejectPlayerWithdrawal,
  approveCustomerServiceWithdrawal,
  rejectCustomerServiceWithdrawal
} from '@/services/unifiedWithdrawalService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const UnifiedWithdrawalManagement: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<UnifiedWithdrawalRequest[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<UnifiedWithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<UnifiedWithdrawalRequest | null>(null);
  const [processRecords, setProcessRecords] = useState<UnifiedProcessRecord[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [processType, setProcessType] = useState<'approve' | 'reject'>('approve');
  const [processNotes, setProcessNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    playerTotal: 0,
    customerServiceTotal: 0,
    totalAmount: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [withdrawals, statusFilter, typeFilter, dateRange]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const data = await getUnifiedWithdrawalRequests();
      setWithdrawals(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      message.error('获取提现申请失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: UnifiedWithdrawalRequest[]) => {
    const stats = {
      total: data.length,
      pending: data.filter(w => w.status === 'pending').length,
      approved: data.filter(w => ['approved', 'completed'].includes(w.status)).length,
      rejected: data.filter(w => w.status === 'rejected').length,
      playerTotal: data.filter(w => w.applicantType === 'player').length,
      customerServiceTotal: data.filter(w => w.applicantType === 'customer_service').length,
      totalAmount: data.reduce((sum, w) => sum + w.amount, 0),
      pendingAmount: data.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0)
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...withdrawals];

    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(w => w.status === statusFilter);
    }

    // 类型筛选
    if (typeFilter !== 'all') {
      filtered = filtered.filter(w => w.applicantType === typeFilter);
    }

    // 日期筛选
    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(w => {
        const createdAt = dayjs(w.createdAt);
        return createdAt.isAfter(start.startOf('day')) && createdAt.isBefore(end.endOf('day'));
      });
    }

    setFilteredWithdrawals(filtered);
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      pending: { color: 'orange', text: '待审核' },
      approved: { color: 'blue', text: '已批准' },
      rejected: { color: 'red', text: '已拒绝' },
      completed: { color: 'green', text: '已完成' },
    };
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getTypeTag = (type: string) => {
    return type === 'player' ? (
      <Tag icon={<UserOutlined />} color="blue">陪玩</Tag>
    ) : (
      <Tag icon={<CustomerServiceOutlined />} color="green">客服</Tag>
    );
  };

  const handleViewDetail = async (record: UnifiedWithdrawalRequest) => {
    setSelectedWithdrawal(record);
    setDetailModalVisible(true);
    
    try {
      const records = await getUnifiedWithdrawalProcessRecords(record.id, record.applicantType);
      setProcessRecords(records);
    } catch (error) {
      console.error('Error fetching process records:', error);
      setProcessRecords([]);
    }
  };

  const handleProcess = (record: UnifiedWithdrawalRequest, type: 'approve' | 'reject') => {
    setSelectedWithdrawal(record);
    setProcessType(type);
    setProcessNotes('');
    setProcessModalVisible(true);
  };

  const confirmProcess = async () => {
    if (!selectedWithdrawal) return;

    if (processType === 'reject' && !processNotes.trim()) {
      message.error('拒绝申请时必须填写拒绝原因');
      return;
    }

    setProcessing(true);
    try {
      let updatedWithdrawal: UnifiedWithdrawalRequest;

      if (selectedWithdrawal.applicantType === 'player') {
        if (processType === 'approve') {
          updatedWithdrawal = await approvePlayerWithdrawal(selectedWithdrawal.id, processNotes);
        } else {
          updatedWithdrawal = await rejectPlayerWithdrawal(selectedWithdrawal.id, processNotes);
        }
      } else {
        if (processType === 'approve') {
          updatedWithdrawal = await approveCustomerServiceWithdrawal(selectedWithdrawal.id, processNotes);
        } else {
          updatedWithdrawal = await rejectCustomerServiceWithdrawal(selectedWithdrawal.id, processNotes);
        }
      }

      // 更新本地数据
      setWithdrawals(prev => 
        prev.map(w => w.id === updatedWithdrawal.id ? updatedWithdrawal : w)
      );

      message.success(`${processType === 'approve' ? '批准' : '拒绝'}申请成功`);
      setProcessModalVisible(false);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      message.error(`${processType === 'approve' ? '批准' : '拒绝'}申请失败`);
    } finally {
      setProcessing(false);
    }
  };

  const columns: ColumnsType<UnifiedWithdrawalRequest> = [
    {
      title: '申请ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: '申请类型',
      dataIndex: 'applicantType',
      key: 'applicantType',
      width: 100,
      render: (type) => getTypeTag(type)
    },
    {
      title: '申请人',
      key: 'applicant',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.applicantName}</div>
          {record.applicantPhone && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.applicantPhone}
            </Text>
          )}
        </div>
      )
    },
    {
      title: '提现金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => (
        <Text strong style={{ color: '#f50' }}>
          ¥{amount.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix()
    },
    {
      title: '处理时间',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: 150,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <>
              <Tooltip title="批准申请">
                <Button
                  type="link"
                  icon={<CheckOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => handleProcess(record, 'approve')}
                />
              </Tooltip>
              <Tooltip title="拒绝申请">
                <Button
                  type="link"
                  icon={<CloseOutlined />}
                  danger
                  onClick={() => handleProcess(record, 'reject')}
                />
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>统一提现管理</Title>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总申请数"
              value={stats.total}
              prefix={<FilterOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核"
              value={stats.pending}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="陪玩申请"
              value={stats.playerTotal}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="客服申请"
              value={stats.customerServiceTotal}
              prefix={<CustomerServiceOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="总申请金额"
              value={stats.totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#f50' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="待审核金额"
              value={stats.pendingAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选器 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Select
              placeholder="申请类型"
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部类型</Option>
              <Option value="player">陪玩</Option>
              <Option value="customer_service">客服</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="申请状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待审核</Option>
              <Option value="approved">已批准</Option>
              <Option value="completed">已完成</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>
          </Col>
          <Col span={8}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchWithdrawals}
              loading={loading}
            >
              刷新
            </Button>
          </Col>
          <Col span={4}>
            <Button
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
                setDateRange(null);
              }}
            >
              重置筛选
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 提现申请表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredWithdrawals}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            total: filteredWithdrawals.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="提现申请详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedWithdrawal && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="申请ID">{selectedWithdrawal.id}</Descriptions.Item>
              <Descriptions.Item label="申请类型">
                {getTypeTag(selectedWithdrawal.applicantType)}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">{selectedWithdrawal.applicantName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedWithdrawal.applicantPhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="提现金额">
                <Text strong style={{ color: '#f50' }}>¥{selectedWithdrawal.amount.toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                {getStatusTag(selectedWithdrawal.status)}
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {dayjs(selectedWithdrawal.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="处理时间">
                {selectedWithdrawal.processedAt ? 
                  dayjs(selectedWithdrawal.processedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              {selectedWithdrawal.alipayAccount && (
                <Descriptions.Item label="支付宝账号" span={2}>
                  {selectedWithdrawal.alipayAccount}
                </Descriptions.Item>
              )}
              {selectedWithdrawal.description && (
                <Descriptions.Item label="申请说明" span={2}>
                  {selectedWithdrawal.description}
                </Descriptions.Item>
              )}
              {selectedWithdrawal.notes && (
                <Descriptions.Item label="处理备注" span={2}>
                  {selectedWithdrawal.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            {processRecords.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <Title level={4}>处理记录</Title>
                <Table
                  dataSource={processRecords}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '状态',
                      dataIndex: 'status',
                      render: (status) => getStatusTag(status)
                    },
                    {
                      title: '操作人',
                      dataIndex: 'processedBy'
                    },
                    {
                      title: '操作时间',
                      dataIndex: 'processedAt',
                      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
                    },
                    {
                      title: '备注',
                      dataIndex: 'notes'
                    }
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 处理模态框 */}
      <Modal
        title={`${processType === 'approve' ? '批准' : '拒绝'}提现申请`}
        open={processModalVisible}
        onOk={confirmProcess}
        onCancel={() => setProcessModalVisible(false)}
        confirmLoading={processing}
        okText="确认"
        cancelText="取消"
      >
        {selectedWithdrawal && (
          <div>
            <p>
              确认{processType === 'approve' ? '批准' : '拒绝'}
              <strong>{selectedWithdrawal.applicantName}</strong>
              的提现申请（金额：<strong>¥{selectedWithdrawal.amount.toFixed(2)}</strong>）？
            </p>
            <Form.Item
              label={processType === 'approve' ? '处理备注' : '拒绝原因'}
              required={processType === 'reject'}
            >
              <TextArea
                value={processNotes}
                onChange={(e) => setProcessNotes(e.target.value)}
                placeholder={
                  processType === 'approve' 
                    ? '请输入处理备注（可选）' 
                    : '请输入拒绝原因（必填）'
                }
                rows={4}
              />
            </Form.Item>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UnifiedWithdrawalManagement;