// src/components/owner/OwnerKPICard.tsx
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { LucideIcon } from 'lucide-react';

interface OwnerKPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactElement<LucideIcon>;
  onClick?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const OwnerKPICard: React.FC<OwnerKPICardProps> = ({
  title,
  value,
  description,
  icon,
  onClick,
  trend
}) => {
  return (
    <Card 
      className={`bg-white shadow-sm hover:shadow-lg transition-all duration-200 border-0 ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
            {trend && (
              <div className={`flex items-center mt-2 text-xs ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="mr-1">
                  {trend.isPositive ? '↗' : '↘'}
                </span>
                <span>{Math.abs(trend.value)}% from last month</span>
              </div>
            )}
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-[#0C4B20] to-[#8FB200] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <div className="w-8 h-8 text-white">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};