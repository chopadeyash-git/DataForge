import { API_BASE_URL } from '../config'

class ProjectAPI {
  async getAuthToken() {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Authentication required')
    }
    
    const authData = await response.json()
    if (!authData.is_authenticated) {
      throw new Error('Authentication required')
    }
    
    return 'session-authenticated'
  }

  async getProjects() {
    await this.getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/v2/projects`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects')
    }
    
    return response.json()
  }

  async createProject(projectData) {
    await this.getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/v2/projects/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(projectData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create project')
    }
    
    return response.json()
  }

  async getProject(projectId) {
    await this.getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/v2/projects/${projectId}`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch project')
    }
    
    return response.json()
  }

  async getProjectDatasets(projectId) {
    await this.getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/v2/projects/${projectId}/datasets`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch datasets')
    }
    
    return response.json()
  }

  async getProjectActivity(projectId) {
    await this.getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/v2/projects/${projectId}/activity`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch activity')
    }
    
    return response.json()
  }

  async uploadDataset(projectId, file, name) {
    await this.getAuthToken()
    
    const formData = new FormData()
    formData.append('file', file)
    if (name) formData.append('name', name)
    
    const response = await fetch(`${API_BASE_URL}/api/v2/projects/${projectId}/datasets`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload dataset')
    }
    
    return response.json()
  }

  async addMember(projectId, email) {
    await this.getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/v2/projects/${projectId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add member')
    }
    
    return response.json()
  }

  async processDataset(projectId, datasetId, config) {
    await this.getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/v2/projects/${projectId}/datasets/${datasetId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(config)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to process dataset')
    }
    
    return response.json()
  }

  async getDatasetSummary(projectId, datasetId) {
    await this.getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/v2/projects/${projectId}/datasets/${datasetId}/summary`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch dataset summary')
    }
    
    return response.json()
  }

  async deleteProject(projectId) {
    await this.getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/v2/projects/${projectId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete project')
    }
    
    return response.json()
  }
}

export const projectAPI = new ProjectAPI()