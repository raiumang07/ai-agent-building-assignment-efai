import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const pythonApi = axios.create({
  baseURL: PYTHON_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const searchCompany = async (companyName) => {
  try {
    // First, get data from Python API
    const pythonResponse = await pythonApi.get('/research/company', {
      params: { company: companyName },
    })
    
    // Try to save to Node.js backend for history and sharing
    // If this fails, we still return the data from Python API
    try {
      const saveResponse = await api.post('/api/research', {
        companyName,
        data: pythonResponse.data,
      })
      
      return saveResponse.data
    } catch (saveError) {
      // If save fails, log but still return the Python API data
      console.warn('Failed to save research to database:', saveError.message)
      console.warn('Returning data from Python API without saving')
      
      // Return data in the expected format without database ID
      return {
        id: `temp-${Date.now()}`,
        companyName,
        data: pythonResponse.data,
        createdAt: new Date(),
      }
    }
  } catch (error) {
    console.error('Error searching company:', error)
    throw error
  }
}

export const getResearchById = async (id) => {
  const response = await api.get(`/api/research/${id}`)
  return response.data
}

export const getAllResearch = async () => {
  const response = await api.get('/api/research')
  return response.data
}

