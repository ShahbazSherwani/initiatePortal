import { auth } from "./firebase";
import { API_BASE_URL } from '../config/environment';

// Use environment variable for API URL, fallback to localhost for development
// API base URL - will be set by environment variables
const API_URL = API_BASE_URL;

// Function to get a fresh token
export async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  try {
    // Force refresh the token
    return await user.getIdToken(true);
  } catch (error) {
    console.error("Failed to refresh token:", error);
    throw error;
  }
}

// Wrapper for API calls that need authentication
export async function authFetch(url: string, options: RequestInit = {}) {
  try {
    const token = await getAuthToken();
    console.log("🔐 Making authenticated request to:", url);
    console.log("🔑 Token (first 20 chars):", token?.substring(0, 20) + "...");
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("📡 Response status:", response.status);
    console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));
    
    // Check if response is ok and is JSON
    if (!response.ok) {
      const text = await response.text();
      console.error("❌ HTTP error response:", text.substring(0, 300));
      throw new Error(`HTTP error! status: ${response.status}. Response: ${text.substring(0, 200)}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Non-JSON response:", text.substring(0, 300));
      throw new Error(`Expected JSON response but got: ${contentType}. Response: ${text.substring(0, 200)}`);
    }
    
    const result = await response.json();
    console.log("✅ Successful API response:", url, "returned", Array.isArray(result) ? `${result.length} items` : typeof result);
    return result;
  } catch (error) {
    console.error("💥 API request failed:", error);
    
    // Special handling for network errors
    if (error.code === "auth/network-request-failed") {
      // Try to use cached data if available
      if (url.includes("/admin/projects")) {
        console.log("Using cached projects data due to network error");
        return JSON.parse(localStorage.getItem("cachedAdminProjects") || "[]");
      }
    }
    
    throw error;
  }
}

// Get all projects for the logged-in user
export async function getMyProjects() {
  try {
    const data = await authFetch(`${API_URL}/projects/my-projects`);
    return data.map((item) => ({
      id: item.id.toString(),
      ...item.project_data,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
}

// Create a project
export async function createProject(project) {
  return await authFetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(project)
  });
}

// Update a project
export async function updateProject(id, projectData) {
  try {
    // Don't try to convert UUID to number
    console.log("Updating project with ID:", id);
    
    return await authFetch(`${API_URL}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    });
  } catch (error) {
    console.error("Update project error:", error);
    throw error;
  }
}

// Get all published projects
export const getAllProjects = async (status = 'published') => {
  try {
    const result = await authFetch(`${API_URL}/projects?status=${status}`);
    return result.projects || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
};

// Get approved projects for investor view
export async function getApprovedProjects() {
  try {
    const data = await authFetch(`${API_URL}/projects?approved=true`);
    return data.map((item) => ({
      id: item.id.toString(),
      creatorId: item.firebase_uid,
      creatorName: item.full_name,
      ...item.project_data,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error("Failed to fetch approved projects:", error);
    return [];
  }
}

// Get projects for calendar view (approved/pending)
export async function getCalendarProjects() {
  try {
    const data = await authFetch(`${API_URL}/calendar/projects`);
    return data.map((item) => ({
      id: item.id.toString(),
      creatorId: item.firebase_uid,
      creatorName: item.full_name,
      ...item.project_data,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error("Failed to fetch calendar projects:", error);
    return [];
  }
}

// Invest in a project
export async function investInProject(id, amount) {
  return await authFetch(`${API_URL}/projects/${id}/invest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount })
  });
}

// Get project by ID
export async function getProjectById(id) {
  try {
    console.log("Fetching project with ID:", id);
    
    const response = await fetch(`${API_URL}/projects/${id}`);
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      id: data.id.toString(),
      creatorId: data.firebase_uid,
      creatorName: data.full_name,
      ...data.project_data,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error("Failed to fetch project:", error);
    throw error;
  }
}

// Add this function to get all projects as admin
export async function getAdminProjects() {
  try {
    const data = await authFetch(`${API_URL}/admin/projects`);
    return data || [];
  } catch (error) {
    console.error("Failed to fetch admin projects:", error);
    return [];
  }
}

// Top-up related functions
export async function getTopUpAccounts() {
  return await authFetch(`${API_URL}/topup/accounts`);
}

export async function submitTopUpRequest(data) {
  return await authFetch(`${API_URL}/topup/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

export async function getMyTopUpRequests() {
  return await authFetch(`${API_URL}/topup/my-requests`);
}

export async function getAdminTopUpRequests() {
  return await authFetch(`${API_URL}/admin/topup-requests`);
}

export async function reviewTopUpRequest(requestId, action, adminNotes) {
  return await authFetch(`${API_URL}/admin/topup-requests/${requestId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action, adminNotes })
  });
}