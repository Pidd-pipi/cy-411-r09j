import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ActivityCategory } from '../../constants/activity';
import { formatActivityCategory } from '../../utils/formatters';

interface TrendPoint {
  date: string;
  value: number;
  category?: ActivityCategory;
  reduction?: number;
  net?: number;
}

export function CarbonTrendChart({ data }: { data: TrendPoint[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    const hasReduction = data.some((point) => point.reduction !== undefined || point.net !== undefined);
    const grouped = data.reduce<Record<string, { gross: number; reduction: number; net: number }>>((acc, row) => {
      const bucket = acc[row.date] || { gross: 0, reduction: 0, net: 0 };
      bucket.gross += row.value;
      bucket.reduction += row.reduction || 0;
      bucket.net += row.net !== undefined ? row.net : row.value;
      acc[row.date] = bucket;
      return acc;
    }, {});
    const dates = Object.keys(grouped);
    const series: echarts.SeriesOption[] = hasReduction
      ? [
          { name: '原排放', type: 'line', smooth: true, data: dates.map((date) => Number(grouped[date].gross.toFixed(2))) },
          { name: '减排量', type: 'line', smooth: true, data: dates.map((date) => Number(grouped[date].reduction.toFixed(2))) },
          {
            name: '净排放',
            type: 'line',
            smooth: true,
            areaStyle: { color: 'rgba(47, 125, 89, 0.12)' },
            data: dates.map((date) => Number(grouped[date].net.toFixed(2)))
          }
        ]
      : [
          {
            name: '排放量',
            type: 'line',
            smooth: true,
            areaStyle: { color: 'rgba(47, 125, 89, 0.12)' },
            data: dates.map((date) => Number(grouped[date].gross.toFixed(2)))
          }
        ];
    chart.setOption({
      color: hasReduction ? ['#c2792f', '#7a9e42', '#2f7d59'] : ['#2f7d59'],
      grid: { left: 36, right: 16, top: hasReduction ? 36 : 20, bottom: 32 },
      legend: hasReduction ? { top: 4, data: ['原排放', '减排量', '净排放'] } : undefined,
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (hasReduction) {
            const lines = (params as any[]).map((item) => `${item.marker} ${item.seriesName} ${item.value} kg CO2e`).join('<br/>');
            return `${params[0].axisValue}<br/>${lines}`;
          }
          return `${params[0].axisValue}<br/>${formatActivityCategory(data[params[0].dataIndex]?.category || ActivityCategory.ENERGY)} ${params[0].value} kg CO2e`;
        }
      },
      xAxis: { type: 'category', boundaryGap: false, data: dates },
      yAxis: { type: 'value', name: 'kg CO2e' },
      series
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
