import React from 'react';
import { X, AlertCircle, Calendar, Info } from 'lucide-react';
import { Button } from '../ui/button';

interface SuspensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suspensionData: {
    message: string;
    suspensionReason?: string;
    suspensionEndDate?: string;
    suspensionScope?: string;
  };
}

export const SuspensionModal: React.FC<SuspensionModalProps> = ({
  isOpen,
  onClose,
  suspensionData
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isTemporarySuspension = suspensionData.suspensionEndDate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-red-500 to-orange-500 rounded-t-2xl p-6 pb-20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 text-white">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Account Suspended</h2>
              <p className="text-white/90 text-sm mt-1">
                {isTemporarySuspension ? 'Temporary Suspension' : 'Suspension Notice'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Card (overlapping header) */}
        <div className="relative -mt-12 mx-4 bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Suspension Details */}
          <div className="space-y-4">
            {/* Reason */}
            {suspensionData.suspensionReason && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
                <Info className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-1">Reason</p>
                  <p className="text-sm text-red-700">{suspensionData.suspensionReason}</p>
                </div>
              </div>
            )}

            {/* End Date */}
            {suspensionData.suspensionEndDate && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <Calendar className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-900 mb-1">Suspension Ends</p>
                  <p className="text-sm text-orange-700">
                    {formatDate(suspensionData.suspensionEndDate)}
                  </p>
                </div>
              </div>
            )}

            {/* Message */}
            <div className="pt-2">
              <p className="text-gray-700 text-sm leading-relaxed">
                {suspensionData.message}
              </p>
            </div>

            {/* Support Info */}
            <div className="mt-6 p-4 bg-gradient-to-br from-[#1a472a] to-[#2d5a3d] rounded-lg">
              <p className="text-white text-sm font-medium mb-2">Need Help?</p>
              <p className="text-white/90 text-xs mb-3">
                If you believe this is an error, please contact our support team.
              </p>
              <a
                href="mailto:support@initiateportal.com"
                className="inline-flex items-center gap-2 text-xs font-medium text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                support@initiateportal.com
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#1a472a] to-[#2d5a3d] hover:from-[#2d5a3d] hover:to-[#1a472a] text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            I Understand
          </Button>
        </div>
      </div>
    </div>
  );
};
