import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { authFetch } from '../lib/api';
import { Navbar } from '../components/Navigation/navbar';
import { Sidebar } from '../components/Sidebar/Sidebar';

export const BorrowHome = () => {
  const { profile, setProfile } = useContext(AuthContext);
  const [showRoleSelector, setShowRoleSelector] = useState(!profile?.role);
  const navigate = useNavigate();
  
  const handleRoleSelection = async (role) => {
    try {
      const result = await authFetch('http://localhost:4000/api/profile/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });
      
      if (result.success) {
        // Update local context with new role
        setProfile(prev => ({ ...prev, role }));
        
        // Navigate to appropriate dashboard
        if (role === 'investor') {
          navigate('/investor/discovery');
        } else {
          setShowRoleSelector(false); // Just hide the selector for borrowers
        }
      }
    } catch (error) {
      console.error('Failed to set role:', error);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <Navbar activePage="home" showAuthButtons={false} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (only show if role is set) */}
        {!showRoleSelector && (
          <div className="hidden md:block w-[325px]">
            <Sidebar activePage="Home" />
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Role Selection Modal */}
          {showRoleSelector && (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mt-10">
              <h2 className="text-2xl font-bold mb-4">Choose Your Role</h2>
              <p className="text-gray-600 mb-6">
                Welcome to Initiate Portal! Please select how you'd like to use the platform.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleRoleSelection('borrower')}
                  className="p-4 border-2 border-[#ffc628] rounded-lg hover:bg-[#fff8e6] transition-colors"
                >
                  <h3 className="font-bold text-lg mb-2">Borrower</h3>
                  <p className="text-sm text-gray-600">
                    Create projects and seek funding from investors.
                  </p>
                </button>
                
                <button
                  onClick={() => handleRoleSelection('investor')}
                  className="p-4 border-2 border-[#ffc628] rounded-lg hover:bg-[#fff8e6] transition-colors"
                >
                  <h3 className="font-bold text-lg mb-2">Investor</h3>
                  <p className="text-sm text-gray-600">
                    Browse projects and invest in opportunities.
                  </p>
                </button>
              </div>
            </div>
          )}
          
          {/* Regular dashboard content (only show if role is set) */}
          {!showRoleSelector && (
            <div>
              {/* Your existing BorrowHome content here */}
              <h1 className="text-2xl font-bold mb-6">Borrower Dashboard</h1>
              {/* Rest of your dashboard content */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};