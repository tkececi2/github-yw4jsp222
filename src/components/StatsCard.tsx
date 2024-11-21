import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, Metric, Text, Flex, ProgressBar } from '@tremor/react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'blue' | 'orange' | 'green' | 'red';
  progress?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  progress
}) => {
  const colorMap = {
    blue: 'primary',
    orange: 'orange',
    green: 'green',
    red: 'red'
  };

  return (
    <Card className="max-w-lg mx-auto overflow-hidden" decoration="top" decorationColor={colorMap[color]}>
      <Flex alignItems="start">
        <div className="w-full">
          <Text className="text-sm sm:text-base">{title}</Text>
          <Metric className="text-xl sm:text-2xl">{value}</Metric>
          {trend && (
            <div className="mt-2">
              <Text color={trend.isPositive ? "green" : "red"}>
                {trend.isPositive ? "+" : "-"}{trend.value}%
                {trend.label && <span className="text-gray-500 ml-1">{trend.label}</span>}
              </Text>
            </div>
          )}
          {typeof progress === 'number' && (
            <ProgressBar value={progress} color={colorMap[color]} className="mt-3" />
          )}
        </div>
        <Icon className={`h-8 w-8 text-${colorMap[color]}-500`} />
      </Flex>
    </Card>
  );
};