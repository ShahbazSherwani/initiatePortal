// src/components/ui/loading-page.tsx
import React from 'react';
import { LoadingSpinner } from './loading-spinner';

interface LoadingPageProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  text = 'Loading...', 
  size = 'lg',
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-center min-h-96 ${className}`}>
      <LoadingSpinner 
        size={size} 
        text={text} 
        showText={true}
      />
    </div>
  );
};

export default LoadingPage;