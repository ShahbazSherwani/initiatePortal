import { auth } from "./firebase";

const API_URL = 'http://localhost:4000/api';

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
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    
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
    const result = await authFetch(`http://localhost:4000/api/projects?status=${status}`);
    return result.projects || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
};

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