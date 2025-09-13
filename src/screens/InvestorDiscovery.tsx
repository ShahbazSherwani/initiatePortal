// src/screens/InvestorDiscovery.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from '../lib/api'; // Adjust the import based on your project structure
import { DashboardLayout } from "../layouts/DashboardLayout";
import { API_BASE_URL } from '../config/environment';
import { Filter, X } from 'lucide-react';

export const InvestorDiscovery: React.FC = () => {
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // ✅ Helper to compute funded/target/percent with fallbacks
  const getFundingNumbers = (project: any) => {
    const pd = project?.project_data || {};
    const d = pd?.details || {};

    const funded = parseFloat(
      pd?.funding?.totalFunded ??
      d?.fundedAmount ??
      pd?.totalFunded ??
      "0"
    );

    const target = parseFloat(
      d?.loanAmount ??
      d?.investmentAmount ??
      d?.fundingAmount ??
      pd?.targetAmount ??
      "0"
    );

    const pct = target > 0 ? Math.min(Math.max((funded / target) * 100, 0), 100) : 0;
    return {
      funded: Number.isFinite(funded) ? funded : 0,
      target: Number.isFinite(target) ? target : 0,
      pct
    };
  };

  // Filter state
  const [filters, setFilters] = useState({
    radius: 28,
    projectTypes: {
      newest: false,
      topPopular: false,
      endingSoon: false,
      individuals: false,
      msme: false
    },
    industries: {
      agriculture: false,
      hospitality: false,
      foodBeverages: false,
      retail: false,
      medicalPharmaceutical: false,
      construction: false,
      others: false
    }
  });
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("Fetching projects for investor discovery...");
        console.log("Making request to:", `${API_BASE_URL}/projects?status=published`);
        const result = await authFetch(`${API_BASE_URL}/projects?status=published`);
        console.log("Projects result:", result);
        console.log("Number of projects returned:", result?.length || 0);
        
        // API returns array directly, not wrapped in projects property
        setAvailableProjects(result || []);
        setFilteredProjects(result || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  // Filter projects based on current filters
  useEffect(() => {
    let filtered = [...availableProjects];
    
    // Apply project type filters for account types (Individual vs MSME)
    if (filters.projectTypes.individuals || filters.projectTypes.msme) {
      filtered = filtered.filter(project => {
        const isIndividualProject = project.creator_is_individual === true;
        const isMSMEProject = project.creator_is_individual === false;
        
        return (filters.projectTypes.individuals && isIndividualProject) ||
               (filters.projectTypes.msme && isMSMEProject);
      });
    }
    
    // Apply industry filters
    const selectedIndustries = Object.entries(filters.industries)
      .filter(([_, selected]) => selected)
      .map(([industry, _]) => industry);
    
    if (selectedIndustries.length > 0) {
      filtered = filtered.filter(project => {
        const category = project?.project_data?.details?.category?.toLowerCase() || '';
        return selectedIndustries.some(industry => {
          switch(industry) {
            case 'agriculture': return category.includes('agriculture') || category.includes('farming');
            case 'hospitality': return category.includes('hospitality') || category.includes('hotel') || category.includes('tourism');
            case 'foodBeverages': return category.includes('food') || category.includes('beverage') || category.includes('restaurant');
            case 'retail': return category.includes('retail') || category.includes('shop') || category.includes('store');
            case 'medicalPharmaceutical': return category.includes('medical') || category.includes('health') || category.includes('pharmaceutical');
            case 'construction': return category.includes('construction') || category.includes('building');
            default: return true;
          }
        });
      });
    }
    
    setFilteredProjects(filtered);
  }, [availableProjects, filters]);

  const handleFilterChange = (type: 'projectTypes' | 'industries', key: string, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value
      }
    }));
  };

  const resetFilters = () => {
    setFilters({
      radius: 28,
      projectTypes: {
        newest: false,
        topPopular: false,
        endingSoon: false,
        individuals: true,
        msme: false
      },
      industries: {
        agriculture: false,
        hospitality: false,
        foodBeverages: false,
        retail: false,
        medicalPharmaceutical: false,
        construction: false,
        others: false
      }
    });
  };

  return (
    <DashboardLayout activePage="investment-opportunities">
      <div className="p-4 md:p-8 m-10 p-6 bg-white rounded-2xl shadow-md min-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Investment Opportunities</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Showing {filteredProjects.length} published projects
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Location Filter */}
              <div>
                <h4 className="font-medium mb-3">Select Location:</h4>
                <div className="mb-2">
                  <label className="text-sm text-gray-600">Set Radius</label>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={filters.radius}
                    onChange={(e) => setFilters(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0ml</span>
                    <span>{filters.radius}ml</span>
                    <span>50ml</span>
                  </div>
                </div>
              </div>

              {/* Project Type Filter */}
              <div>
                <h4 className="font-medium mb-3">Project Type:</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.projectTypes.newest}
                      onChange={(e) => handleFilterChange('projectTypes', 'newest', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Newest</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.projectTypes.topPopular}
                      onChange={(e) => handleFilterChange('projectTypes', 'topPopular', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Top Popular</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.projectTypes.endingSoon}
                      onChange={(e) => handleFilterChange('projectTypes', 'endingSoon', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Ending Soon</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.projectTypes.individuals}
                      onChange={(e) => handleFilterChange('projectTypes', 'individuals', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Individuals</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.projectTypes.msme}
                      onChange={(e) => handleFilterChange('projectTypes', 'msme', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">MSME(Company)</span>
                  </label>
                </div>
              </div>

              {/* Industry Filter */}
              <div>
                <h4 className="font-medium mb-3">Industry:</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.industries.agriculture}
                      onChange={(e) => handleFilterChange('industries', 'agriculture', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Agriculture</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.industries.hospitality}
                      onChange={(e) => handleFilterChange('industries', 'hospitality', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Hospitality</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.industries.foodBeverages}
                      onChange={(e) => handleFilterChange('industries', 'foodBeverages', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Food & Beverages</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.industries.retail}
                      onChange={(e) => handleFilterChange('industries', 'retail', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Retail</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.industries.medicalPharmaceutical}
                      onChange={(e) => handleFilterChange('industries', 'medicalPharmaceutical', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Medical & Pharmaceutical</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.industries.construction}
                      onChange={(e) => handleFilterChange('industries', 'construction', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Construction</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.industries.others}
                      onChange={(e) => handleFilterChange('industries', 'others', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Others</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <button
                onClick={resetFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="bg-[#0C4B20] hover:bg-[#8FB200] text-white px-6 py-2 rounded-lg font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        )}
          
        {/* Debug info */}
        {/* <div className="mb-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
          <strong>Debug Info:</strong> Looking for projects with status="published". 
          If you don't see projects here, make sure to "Publish" them from the "My Issuer/Borrower" page first.
        </div> */}
          
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-500">Loading investment opportunities...</div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-center">
            <div className="text-lg text-gray-500 mb-2">No investment opportunities available</div>
            <div className="text-sm text-gray-400">Try adjusting your filters or check back later for new projects</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: any) => {
              const projectData = project.project_data || {};
              const details = projectData.details || {};
              const { funded, target, pct } = getFundingNumbers(project); // ✅ compute here

              return (
                <div 
                  key={project.id} 
                  className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/investor/project/${project.id}`)}
                >
                  <img 
                    src={details.image || "https://placehold.co/600x400/ffc628/ffffff?text=Project"}
                    alt={details.product || "Project"} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{details.product || "Unnamed Project"}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{details.overview || "No description available"}</p>
                    
                    {/* Funding header */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Funding</span>
                      <span className="font-medium">{Math.round(pct)}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                      <div 
                        className="bg-[#0C4B20] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Funded vs Target */}
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>PHP {Math.round(funded).toLocaleString()}</span>
                      <span>of PHP {Math.round(target).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Required</p>
                        <p className="font-medium">
                          {parseFloat(details.loanAmount || 
                                      details.investmentAmount || "0").toLocaleString()} PHP
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Est. Return</p>
                        <p className="font-medium">{projectData.estimatedReturn || details.investorPercentage || "N/A"}%</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <button className="w-full bg-[#0C4B20] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#8FB200] transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
