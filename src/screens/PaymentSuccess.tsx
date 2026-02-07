// src/screens/PaymentSuccess.tsx
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const hasConfirmed = useRef(false);
  
  const projectId = searchParams.get('project_id');
  const amount = searchParams.get('amount');
  
  useEffect(() => {
    // Confirm the payment and record the investment
    const confirmPayment = async () => {
      // Prevent double confirmation
      if (hasConfirmed.current) return;
      hasConfirmed.current = true;
      
      if (!projectId || !amount) {
        setError('Missing payment information');
        setLoading(false);
        return;
      }
      
      try {
        console.log('📤 Confirming payment for project:', projectId, 'amount:', amount);
        
        const response = await authFetch(`${API_BASE_URL}/payments/confirm`, {
          method: 'POST',
          body: JSON.stringify({
            projectId: projectId,
            amount: parseFloat(amount)
          })
        });
        
        console.log('📥 Payment confirmation response:', response);
        
        if (response.success) {
          if (response.alreadyExists) {
            toast.success("Investment already recorded!");
          } else {
            toast.success("Payment successful! Your investment has been recorded.");
          }
          
          setPaymentDetails({
            projectId,
            amount: parseFloat(amount)
          });
        } else {
          throw new Error(response.error || 'Failed to confirm payment');
        }
      } catch (err: any) {
        console.error('❌ Payment confirmation error:', err);
        setError(err.message || 'Failed to record investment. Please contact support.');
        toast.error('Failed to record investment');
      } finally {
        setLoading(false);
      }
    };
    
    confirmPayment();
  }, [projectId, amount]);
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
        <div className="flex flex-1 overflow-hidden">
          <div className="w-0 md:w-[280px] flex-shrink-0">
            <Sidebar activePage="My Investments" />
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#0C4B20]" />
              <p className="mt-4 text-gray-600">Recording your investment...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
        <div className="flex flex-1 overflow-hidden">
          <div className="w-0 md:w-[280px] flex-shrink-0">
            <Sidebar activePage="My Investments" />
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-lg mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-12 h-12 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Something Went Wrong
                </h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <p className="text-sm text-gray-500 mb-6">
                  Your payment was successful, but we couldn't record your investment automatically. 
                  Please contact support with your payment details.
                </p>
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => navigate('/investor/investments')}
                    className="w-full bg-[#0C4B20] text-white hover:bg-[#8FB200]"
                  >
                    View My Investments
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/investor/discover')}
                    className="w-full"
                  >
                    Back to Projects
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-0 md:w-[280px] flex-shrink-0">
          <Sidebar activePage="My Investments" />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Payment Successful!
              </h1>
              
              {/* Description */}
              <p className="text-gray-600 mb-6">
                Thank you for your investment. Your payment has been processed successfully.
              </p>
              
              {/* Payment Details */}
              {paymentDetails && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <h3 className="font-medium text-gray-700 mb-3">Payment Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-[#0C4B20]">
                        ₱{paymentDetails.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-green-600 font-medium">Paid</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Info Note */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-800">
                  <strong>What's next?</strong><br />
                  Your investment will be reviewed by the project owner. You'll receive a notification once it's confirmed.
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => navigate('/investor/investments')}
                  className="w-full bg-[#0C4B20] text-white hover:bg-[#8FB200]"
                >
                  View My Investments
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/investor/discover')}
                  className="w-full"
                >
                  Browse More Projects
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
