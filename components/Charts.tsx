import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BenchmarkResult, AlgorithmType } from '../types';

interface ChartsProps {
  results: BenchmarkResult[];
}

const COLORS = {
  [AlgorithmType.Bubble]: '#ef4444',    // Red
  [AlgorithmType.Selection]: '#f97316', // Orange
  [AlgorithmType.Insertion]: '#eab308', // Yellow
  [AlgorithmType.Quick]: '#22c55e',     // Green
  [AlgorithmType.Merge]: '#3b82f6',     // Blue
};

export const PerformanceCharts: React.FC<ChartsProps> = ({ results }) => {
  const [metric, setMetric] = useState<'timeMs' | 'comparisons' | 'swaps'>('timeMs');
  const [useLogScale, setUseLogScale] = useState(true);
  const [scenarioFilter, setScenarioFilter] = useState<string>('全部');

  if (results.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
        请运行实验以查看结果
      </div>
    );
  }

  // 1. 过滤数据
  const filteredResults = scenarioFilter === '全部' 
    ? results 
    : results.filter(r => r.scenario === scenarioFilter);

  // 2. 按规模和算法聚合数据（如果存在多个场景则取平均值）
  const dataMap = new Map<number, any>();
  
  // 临时存储用于计算平均值的计数器
  const counters = new Map<string, { sum: number, count: number }>();

  filteredResults.forEach(r => {
    const key = `${r.size}-${r.algorithm}`;
    const val = r.metrics[metric];
    
    if (!counters.has(key)) {
      counters.set(key, { sum: 0, count: 0 });
    }
    const c = counters.get(key)!;
    c.sum += val;
    c.count += 1;
  });

  // 转换为 Recharts 格式
  filteredResults.forEach(r => {
    if (!dataMap.has(r.size)) {
      dataMap.set(r.size, { name: r.size.toString(), rawSize: r.size });
    }
    const entry = dataMap.get(r.size);
    const key = `${r.size}-${r.algorithm}`;
    const avg = counters.get(key)!.sum / counters.get(key)!.count;
    
    // 对数刻度处理：如果值为0，给一个极小值以便显示
    let finalValue = avg;
    if (useLogScale && finalValue <= 0) {
      finalValue = metric === 'timeMs' ? 0.0001 : 0.1;
    }
    
    entry[r.algorithm] = Number(finalValue.toFixed(4));
  });

  const chartData = Array.from(dataMap.values()).sort((a, b) => a.rawSize - b.rawSize);
  const algorithms = Array.from(new Set(filteredResults.map(r => r.algorithm)));

  const metricLabel = {
    timeMs: '运行时间 (毫秒)',
    comparisons: '比较次数',
    swaps: '交换/移动次数',
  }[metric];

  return (
    <div className="space-y-6">
      {/* 控制栏 */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">指标</label>
          <div className="flex bg-slate-100 p-1 rounded-md">
            {(['timeMs', 'comparisons', 'swaps'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                  metric === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m === 'timeMs' ? '用时' : m === 'comparisons' ? '比较' : '交换'}
              </button>
            ))}
          </div>
        </div>

        <div>
           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">刻度</label>
           <button
            onClick={() => setUseLogScale(!useLogScale)}
            className={`px-3 py-1.5 text-sm font-medium rounded border transition-all ${
              useLogScale ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            {useLogScale ? '对数刻度' : '线性刻度'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">场景过滤</label>
          <div className="relative">
            <select 
              className="px-3 py-1.5 text-sm bg-white text-slate-700 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none pr-10 w-48"
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value)}
            >
              <option value="全部">全部场景 (平均值)</option>
              <option value="随机数组">随机数组</option>
              <option value="有序数组">有序数组</option>
              <option value="逆序数组">逆序数组</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 图表展示 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-[500px]">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">
          {metricLabel} 随数据规模的变化 {scenarioFilter !== '全部' ? `(${scenarioFilter})` : ''}
        </h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" label={{ value: '规模 (N)', position: 'insideBottom', offset: -5 }} />
            <YAxis 
              stroke="#64748b" 
              scale={useLogScale ? 'log' : 'auto'} 
              domain={useLogScale ? [
                (dataMin: number) => Math.pow(10, Math.floor(Math.log10(Math.max(dataMin, 0.0001)))), 
                'auto'
              ] : [0, 'auto']}
              tickFormatter={(val) => {
                 if (val >= 1000000) return `${val/1000000}M`;
                 if (val >= 1000) return `${val/1000}k`;
                 if (val < 1 && val > 0) return val.toPrecision(1);
                 return val;
              }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '12px' }}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
              formatter={(value: number) => [
                metric === 'timeMs' ? `${value} 毫秒` : value.toLocaleString(), 
                ''
              ]}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {algorithms.map((algo) => (
              <Bar 
                key={algo} 
                dataKey={algo} 
                fill={COLORS[algo as AlgorithmType]} 
                radius={[4, 4, 0, 0]} 
                name={algo}
                minPointSize={2} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-slate-500 text-center italic">
        * 注意：在对数刻度下，由于快速排序/归并排序在小规模(N=100)时耗时极短，其条形高度会显著低于 O(N²) 算法。
      </p>
    </div>
  );
};