import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { EmptyState } from '../components/common/EmptyState';
import { useReductionStore } from '../stores/reductionStore';
import { useAuth } from '../hooks/useAuth';
import { Reduction } from '../types/entities';
import { Messages } from '../constants/messages';
import { formatDate } from '../utils/formatters';

interface ReductionFormValues {
  measure: string;
  reductionValue: number;
  unit: string;
  recordDate: dayjs.Dayjs;
  note?: string;
}

export function Reductions() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reduction | null>(null);
  const rows = useReductionStore((state) => state.rows);
  const load = useReductionStore((state) => state.load);
  const add = useReductionStore((state) => state.add);
  const update = useReductionStore((state) => state.update);
  const remove = useReductionStore((state) => state.remove);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    void load();
  }, [load, token]);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (reduction: Reduction) => {
    setEditing(reduction);
    setOpen(true);
  };

  const submit = async (values: ReductionFormValues) => {
    const payload = { ...values, recordDate: values.recordDate.format('YYYY-MM-DD') };
    if (editing) {
      await update(editing.id, payload);
      message.success(Messages.FRONTEND_REDUCTION_UPDATED);
    } else {
      await add(payload);
      message.success(Messages.FRONTEND_REDUCTION_SAVED);
    }
    setOpen(false);
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Typography.Title level={2}>减排台账</Typography.Title>
          <Typography.Text type="secondary">按日期登记减排措施与减少量，同一天同一措施只保留一条，重复提交会被拦截。</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>登记减排</Button>
      </Space>
      <Card>
        <Table
          rowKey="id"
          dataSource={rows}
          locale={{ emptyText: <EmptyState text="暂无减排记录" /> }}
          columns={[
            { title: '日期', dataIndex: 'recordDate', render: formatDate },
            { title: '措施', dataIndex: 'measure' },
            { title: '减少量', dataIndex: 'reductionValue', render: (value: string) => Number(value).toFixed(2) },
            { title: '单位', dataIndex: 'unit' },
            { title: '备注', dataIndex: 'note', render: (value: string | null) => value || '无备注' },
            {
              title: '操作',
              key: 'actions',
              render: (_, reduction) => (
                <Space>
                  <Button size="small" onClick={() => openEdit(reduction)}>编辑</Button>
                  <Popconfirm
                    title="移除这条减排记录？"
                    okText="移除"
                    cancelText="取消"
                    onConfirm={async () => {
                      await remove(reduction.id);
                      message.success(Messages.FRONTEND_REDUCTION_DELETED);
                    }}
                  >
                    <Button size="small" danger>移除</Button>
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Card>
      <Modal title={editing ? '调整减排记录' : '登记减排'} open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form<ReductionFormValues>
          key={editing ? editing.id : 'new'}
          layout="vertical"
          initialValues={
            editing
              ? {
                  measure: editing.measure,
                  reductionValue: Number(editing.reductionValue),
                  unit: editing.unit,
                  recordDate: dayjs(editing.recordDate),
                  note: editing.note || undefined
                }
              : { unit: 'kg CO2e', recordDate: dayjs() }
          }
          onFinish={submit}
        >
          <Form.Item name="measure" label="减排措施" rules={[{ required: true, message: '请填写措施名称' }]}>
            <Input placeholder="如：地铁替代开车 / LED 改造" />
          </Form.Item>
          <Form.Item name="reductionValue" label="减少量" rules={[{ required: true, message: '请填写减少量' }]}>
            <InputNumber min={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true, message: '请填写单位' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="recordDate" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>{editing ? '保存调整' : '保存登记'}</Button>
        </Form>
      </Modal>
    </Space>
  );
}
