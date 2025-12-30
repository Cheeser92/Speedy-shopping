import React from 'react';
import * as LucideIcons from 'lucide-react';

export const IconComponent: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size = 20, className }) => {
  const Icon = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
  return <Icon size={size} className={className} />;
};
