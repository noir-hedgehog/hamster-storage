import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8" role="status" aria-label={text || '加载中'}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-mint-600`} />
      {text && <p className="mt-4 text-sm text-gray-600">{text}</p>}
    </div>
  );
}
