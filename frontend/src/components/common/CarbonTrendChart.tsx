import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { formatCarbon } from '../../utils/formatters';

export interface TrendPoint {
  date: string;
  value: number;
  gross?: number;
  reduction?: number;
  net?: number;
}

export function CarbonTrendChart({ data }: { data: TrendPoint[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    const hasReductionSeries = data.some((row) => (row.reduction ?? 0) > 0);
    const grouped = data.reduce<Record<string, { gross: number; reduction: number }>>((acc, row) => {
      const date = row.date;
      const gross = row.gross ?? row.value;
      const reduction = row.reduction ?? 0;
      if (!acc[date]) acc[date] = { gross: 0, reduction: 0 };
      acc[date].gross += gross;
      acc[date].reduction += reduction;
      return acc;
    }, {});
    const dates = Object.keys(grouped).sort();
    const grossData = dates.map((date) => Number(grouped[date].gross.toFixed(2)));
    const reductionData = dates.map((date) => Number(grouped[date].reduction.toFixed(2)));
    const netData = dates.map((date) => Number(Math.max(0, grouped[date].gross - grouped[date].reduction).toFixed(2)));
    chart.setOption({
      color: ['#2f7d59', '#d48806', '#3b7dd8'],
      legend: hasReductionSeries ? { top: 0, data: ['原排放', '减排量', '净排放'] } : undefined,
      grid: { left: 36, right: 16, top: hasReductionSeries ? 40 : 20, bottom: 32 },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const lines = params.map((item: any) => `${item.marker}${item.seriesName}：${formatCarbon(item.value)}`);
          return `${params[0].axisValue}<br/>${lines.join('<br/>')}`;
        }
      },
      xAxis: { type: 'category', boundaryGap: false, data: dates },
      yAxis: { type: 'value', name: 'kg CO2e' },
      series: hasReductionSeries
        ? [
            { name: '原排放', type: 'line', smooth: true, areaStyle: { color: 'rgba(47, 125, 89, 0.12)' }, data: grossData },
            { name: '减排量', type: 'bar', itemStyle: { color: '#d48806', opacity: 0.55 }, barWidth: 10, data: reductionData },
            { name: '净排放', type: 'line', smooth: true, lineStyle: { type: 'dashed' }, data: netData }
          ]
        : [
            {
              name: '排放量',
              type: 'line',
              smooth: true,
              areaStyle: { color: 'rgba(47, 125, 89, 0.12)' },
              data: grossData
            }
          ]
    });
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      chart.dispose();
    };
  }, [data]);

  return <div className="chart-panel" ref={ref} />;
}
