import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authFetch } from '../lib/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { API_BASE_URL } from '../config/environment';

export const BorrowHome = () => {
  const { profile, setProfile } = useAuth();
  const [showRoleSelector, setShowRoleSelector] = useState(!profile?.role);
  const navigate = useNavigate();
  
  // Check if user has completed registration
  useEffect(() => {
    if (profile && !profile.hasCompletedRegistration) {
      setShowRoleSelector(true);
    }
  }, [profile]);
  
  const handleRoleSelection = async (role: string) => {
    try {
      console.log(`Selecting role: ${role}`);
      
      const result = await authFetch(`${API_BASE_URL}/profile/set-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });
      
      if (result.success) {
        // Update local profile with new role
        setProfile((prev: any) => ({ 
          ...prev, 
          role,
          // Don't mark as completed yet - they still need to go through registration
          hasCompletedRegistration: false 
        }));
        
        // Start the registration flow
        if (role === 'investor') {
          navigate('/borrowreg', { state: { accountType: 'individual' } });
        } else if (role === 'borrower') {
          navigate('/borrowreg', { state: { accountType: 'borrower' } });
        } else if (role === 'guarantor') {
          navigate('/borrowreg', { state: { accountType: 'guarantee' } });
        }
      } else {
        console.error("Failed to set role:", result);
        alert("Failed to set role. Please try again.");
      }
    } catch (error) {
      console.error("Error setting role:", error);
      alert("An error occurred. Please try again.");
    }
  };
  
  return (
    <DashboardLayout activePage="borrow-home">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4">
          {/* Role selector */}
          {showRoleSelector ? (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mt-10">
              <h2 className="text-2xl font-bold mb-4">Choose Your Role</h2>
              <p className="text-gray-600 mb-6">
                Welcome to Initiate Portal! Please select how you'd like to use the platform.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleRoleSelection('investor')}
                  className="p-4 border-2 border-[#ffc628] rounded-lg hover:bg-[#fff8e6] transition-colors"
                >
                  <h3 className="font-bold text-lg mb-2">Invest/Lender</h3>
                  <img src="/investor-1.png" alt="Investor" className="w-20 h-20 mx-auto" />
                  <p className="text-sm text-gray-600 mt-2">
                    Browse projects and invest in opportunities.
                  </p>
                </button>
                
                <button
                  onClick={() => handleRoleSelection('borrower')}
                  className="p-4 border-2 border-[#ffc628] rounded-lg hover:bg-[#fff8e6] transition-colors"
                >
                  <h3 className="font-bold text-lg mb-2">Issue/Borrower</h3>
                  <img src="/debt-1.png" alt="Borrower" className="w-20 h-20 mx-auto" />
                  <p className="text-sm text-gray-600 mt-2">
                    Create projects and seek funding.
                  </p>
                </button>
                
                {/* Hidden Guarantee option */}
                {/* <button
                  onClick={() => handleRoleSelection('guarantor')}
                  className="p-4 border-2 border-[#ffc628] rounded-lg hover:bg-[#fff8e6] transition-colors"
                >
                  <h3 className="font-bold text-lg mb-2">Guarantee</h3>
                  <img src="/cashback-1.png" alt="Guarantee" className="w-20 h-20 mx-auto" />
                  <p className="text-sm text-gray-600 mt-2">
                    Provide guarantees for borrowers.
                  </p>
                </button> */}
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold mb-6">Welcome Back!</h1>
              <p>Please select an option from the sidebar.</p>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};