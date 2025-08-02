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
export async function authFetch(url, options = {}) {
  try {
    // Get a fresh token
    const token = await getAuthToken();
    
    // Merge headers with authorization
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    
    // Make the request
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
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