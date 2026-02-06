// src/screens/PaymentSuccess.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  const projectId = searchParams.get('project_id');
  const amount = searchParams.get('amount');
  
  useEffect(() => {
    // Show success message
    toast.success("Payment successful! Your investment has been recorded.");
    setLoading(false);
    
    setPaymentDetails({
      projectId,
      amount: amount ? parseFloat(amount) : 0
    });
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
              <p className="mt-4 text-gray-600">Processing your payment...</p>
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
