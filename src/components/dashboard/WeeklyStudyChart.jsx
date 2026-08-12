import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeeklyStudyChart({ chartData = [], onStartFocus }) {
  const navigate = useNavigate();

  // Check if there is any study session data at all
  const hasData = chartData.some(d => d.hours > 0);

  // Compute total weekly hours
  const totalHours = chartData.reduce((sum, d) => sum + d.hours, 0).toFixed(1);

  // Custom tooltip renderer for standard dark theme styling
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-card border border-border-card px-3 py-1.5 rounded-lg text-xs shadow-xl leading-none font-medium">
          <p className="text-text-primary">{payload[0].value} hours studied</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border border-border-card/40 bg-bg-card/50 flex flex-col h-[280px]">
      <CardHeader className="flex items-center justify-between p-5 pb-2">
        <h3 className="font-bold text-base tracking-tight font-display text-text-primary">Study Hours</h3>
        {hasData && (
          <span className="text-xs font-bold text-brand-purple bg-brand-purple-bg border border-brand-purple/20 px-2.5 py-1 rounded">
            Total: {totalHours}h
          </span>
        )}
      </CardHeader>
      <CardBody className="p-4 flex-1 flex flex-col justify-center">
        {!hasData ? (
          <div className="text-center py-6 px-4 space-y-4">
            <p className="text-sm text-text-muted">Your study graph will appear after your first focus session.</p>
            <Button 
              variant="glass" 
              size="sm" 
              onClick={onStartFocus}
              className="mx-auto flex items-center gap-1.5 text-xs border border-brand-purple/30 hover:border-brand-purple/50 bg-brand-purple-bg/10 hover:bg-brand-purple-bg/25 text-brand-purple"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Focus Session
            </Button>
          </div>
        ) : (
          <div className="w-full h-full min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <XAxis 
                  dataKey="name" 
                  stroke="#8C8C9E" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#8C8C9E" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}h`}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar 
                  dataKey="hours" 
                  fill="#9D7BF5" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
