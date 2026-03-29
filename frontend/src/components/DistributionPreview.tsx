import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { DistributionConfig } from '../types';
import { useDistributionChartData } from './DistributionPreview/useDistributionCalculations';

interface DistributionPreviewProps {
  distribution: DistributionConfig;
  duration?: number;
  samples?: number;
}

export function DistributionPreview({ distribution, samples = 50 }: DistributionPreviewProps) {
  const chartData = useDistributionChartData(distribution, samples);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="progress" 
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
            label={{ value: 'Progress %', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
            label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px' }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value) => [`${Number(value).toFixed(1)} req/s`, 'Rate']}
            labelFormatter={(label) => `${label}%`}
          />
          <Area 
            type="monotone" 
            dataKey="rate" 
            stroke="#6366f1" 
            fillOpacity={1} 
            fill="url(#colorRate)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DistributionPreview;