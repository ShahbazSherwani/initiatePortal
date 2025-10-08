import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  showText?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  className = "",
  text = "Loading...",
  showText = false
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  const containerSizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  if (showText) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full border-b-2 border-[#0C4B20] mx-auto mb-4 ${containerSizeClasses[size]}`} />
          <div className={`text-gray-600 ${textSizeClasses[size]}`}>
            {text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-block animate-spin ${sizeClasses[size]} ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

interface LoadingOverlayProps {
  message?: string;
  show: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = "Loading...", 
  show 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center shadow-xl">
        <LoadingSpinner size="lg" className="mx-auto mb-4 text-[#0C4B20]" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};