import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Pagination, Popconfirm, Select, Space, Table, Typography, message } from 'antd';
import type { Dayjs } from 'dayjs';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { EmptyState } from '../components/common/EmptyState';
import { ReductionUnit, REDUCTION_UNIT_LABELS } from '../constants/reduction';
import { Messages } from '../constants/messages';
import { usePagination } from '../hooks/usePagination';
import { useAuth } from '../hooks/useAuth';
import { useReductionStore } from '../stores/reductionStore';
import { ReductionRecord } from '../types/entities';
import { ReductionPayload } from '../api/reduction';
import { formatDate } from '../utils/formatters';

interface ReductionFormValues {
  measure: string;
  reductionValue: number;
  unit: ReductionUnit;
  recordDate: Dayjs;
}

export function Reductions() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReductionRecord | null>(null);
  const [form] = Form.useForm<ReductionFormValues>();
  const rows = useReductionStore((state) => state.rows);
  const load = useReductionStore((state) => state.load);
  const add = useReductionStore((state) => state.add);
  const update = useReductionStore((state) => state.update);
  const remove = useReductionStore((state) => state.remove);
  const { token } = useAuth();
  const pagination = usePagination(rows, 8);
  const totalReduction = useMemo(
    () => rows.filter((row) => row.unit === ReductionUnit.KG_CO2E).reduce((sum, row) => sum + Number(row.reductionValue), 0),
    [rows]
  );

  useEffect(() => {
    if (!token) return;
    void load();
  }, [load, token]);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (record: ReductionRecord) => {
    setEditing(record);
    form.setFieldsValue({
      measure: record.measure,
      reductionValue: Number(record.reductionValue),
      unit: record.unit,
      recordDate: dayjs(record.recordDate)
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload: ReductionPayload = { ...values, recordDate: values.recordDate.format('YYYY-MM-DD') };
    if (editing) {
      await update(editing.id, payload);
      message.success(Messages.FRONTEND_REDUCTION_UPDATED);
    } else {
      await add(payload);
      message.success(Messages.FRONTEND_REDUCTION_SAVED);
    }
    setOpen(false);
    setEditing(null);
  };

  const handleDelete = async (record: ReductionRecord) => {
    await remove(record.id);
    message.success(Messages.FRONTEND_REDUCTION_DELETED);
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Typography.Title level={2}>减排台账</Typography.Title>
          <Typography.Text type="secondary">按日期登记减排措施、减少量与单位，同一人同一天同一措施只保留一条。</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>登记减排</Button>
      </Space>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={pagination.currentRows}
        locale={{ emptyText: <EmptyState text="暂无减排记录" /> }}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={3}><Typography.Text strong>累计减排（本列表范围）</Typography.Text></Table.Summary.Cell>
            <Table.Summary.Cell index={1}><Typography.Text strong>{totalReduction.toFixed(2)} kg CO2e</Typography.Text></Table.Summary.Cell>
            <Table.Summary.Cell index={2} colSpan={2} />
          </Table.Summary.Row>
        )}
        columns={[
          { title: '日期', dataIndex: 'recordDate', key: 'recordDate', width: 130, render: (value: string) => formatDate(value) },
          { title: '减排措施', dataIndex: 'measure', key: 'measure' },
          { title: '减少量', dataIndex: 'reductionValue', key: 'reductionValue', width: 120, align: 'right', render: (value: string) => Number(value).toFixed(2) },
          { title: '单位', dataIndex: 'unit', key: 'unit', width: 130 },
          {
            title: '操作',
            key: 'actions',
            width: 140,
            render: (_, record) => (
              <Space size={4}>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>调整</Button>
                <Popconfirm
                  title="移除该减排记录？"
                  description="移除后仪表盘按剩余记录重新汇总。"
                  okText="移除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => void handleDelete(record)}
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>移除</Button>
                </Popconfirm>
              </Space>
            )
          }
        ]}
      />
      <Pagination current={pagination.page} pageSize={pagination.pageSize} total={pagination.total} showSizeChanger onChange={(page, size) => { pagination.setPage(page); pagination.setPageSize(size); }} />
      <Modal
        title={editing ? '调整减排记录' : '登记减排措施'}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); }}
        onOk={handleSubmit}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ unit: ReductionUnit.KG_CO2E, recordDate: dayjs() }} preserve={false}>
          <Form.Item name="measure" label="减排措施" rules={[{ required: true, whitespace: true, message: '请填写减排措施' }]}>
            <Input placeholder="如：地铁替代开车、空调调到 26℃" maxLength={128} />
          </Form.Item>
          <Form.Item name="reductionValue" label="减少量" rules={[{ required: true, message: '请填写减少量' }]}>
            <InputNumber min={0.01} precision={2} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true, message: '请选择单位' }]}>
            <Select options={Object.values(ReductionUnit).map((value) => ({ value, label: REDUCTION_UNIT_LABELS[value] }))} />
          </Form.Item>
          <Form.Item name="recordDate" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
