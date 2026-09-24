import { Card, Statistic } from 'antd';
import { formatCarbon } from '../../utils/formatters';

export interface CarbonStatValue {
  gross: number;
  reduction: number;
  net: number;
}

export function CarbonStatCard({ title, value }: { title: string; value: CarbonStatValue }) {
  const hasReduction = value.reduction > 0;
  return (
    <Card>
      <Statistic title={title} value={formatCarbon(value.gross)} />
      {hasReduction ? (
        <div style={{ marginTop: 8, fontSize: 12, color: '#6d7c73', lineHeight: 1.8 }}>
          <div>原排放：{formatCarbon(value.gross)}</div>
          <div style={{ color: '#ad6800' }}>减排量：-{formatCarbon(value.reduction)}</div>
          <div style={{ color: '#2f7d59', fontWeight: 600 }}>净排放：{formatCarbon(value.net)}</div>
        </div>
      ) : (
        <div style={{ marginTop: 8, fontSize: 12, color: '#6d7c73' }}>暂无减排登记，按原排放口径展示</div>
      )}
    </Card>
  );
}
