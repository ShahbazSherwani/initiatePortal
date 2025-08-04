import React, { useState } from 'react';
import { Button } from '../ui/button';
import { authFetch } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/environment';

interface InterestButtonProps {
  projectId: string;
  hasShownInterest?: boolean;
  onInterestShown?: () => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export const InterestButton: React.FC<InterestButtonProps> = ({
  projectId,
  hasShownInterest = false,
  onInterestShown,
  className = '',
  size = 'default'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();

  const handleShowInterest = async () => {
    if (!profile || hasShownInterest) return;

    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/projects/${projectId}/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: "I'm interested in investing in this project"
        })
      });

      if (response.success) {
        if (onInterestShown) {
          onInterestShown();
        }
      } else {
        console.error("Failed to show interest:", response.error);
      }
    } catch (error) {
      console.error("Error showing interest:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (profile?.role !== 'investor') {
    return null; // Only show for investors
  }

  return (
    <Button
      size={size}
      variant={hasShownInterest ? "outline" : "default"}
      className={`${
        hasShownInterest 
          ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200" 
          : "bg-[#ffc628] text-black hover:bg-[#e6b324]"
      } ${className}`}
      onClick={handleShowInterest}
      disabled={isLoading || hasShownInterest}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        hasShownInterest ? "Interested" : "Interest"
      )}
    </Button>
  );
};
