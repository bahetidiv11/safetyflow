import { cn } from '@/lib/utils';
import { RiskLevel } from '@/types/icsr';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const riskConfig = {
  high: {
    label: 'High Risk',
    icon: AlertTriangle,
    classes: 'risk-badge-high',
  },
  medium: {
    label: 'Medium Risk',
    icon: AlertCircle,
    classes: 'risk-badge-medium',
  },
  low: {
    label: 'Low Risk',
    icon: CheckCircle,
    classes: 'risk-badge-low',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function RiskBadge({ level, showIcon = true, size = 'md' }: RiskBadgeProps) {
  const config = riskConfig[level];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.classes,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />}
      {config.label}
    </span>
  );
}
