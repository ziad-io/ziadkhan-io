// API Service for connecting to backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Utility Functions
const calculateGrade = (percentage, marks) => {
  const failCount = Object.values(marks).filter(mark => mark < 33).length
  
  // Fail if 2 or more subjects fail
  if (failCount >= 2) return 'F'
  
  // Pass if 0 or 1 subject fails
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  return 'F'
}

const calculateResults = (studentData) => {
  const marks = {
    english: parseInt(studentData.english) || 0,
    maths: parseInt(studentData.maths) || 0,
    science: parseInt(studentData.science) || 0,
    urdu: parseInt(studentData.urdu) || 0,
    islamiat: parseInt(studentData.islamiat) || 0,
    pashto: parseInt(studentData.pashto) || 0
  }
  
  const total = Object.values(marks).reduce((sum, mark) => sum + mark, 0)
  const percentage = (total / 550) * 100
  const grade = calculateGrade(percentage, marks)
  
  return { total, percentage, grade, marks }
}

// API Functions
export const apiService = {
  // Health Check
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      return await response.json()
    } catch (error) {
      console.error('Health check failed:', error)
      return null
    }
  },

  // Get all students
  async getAllStudents() {
    try {
      const response = await fetch(`${API_BASE_URL}/students`)
      if (!response.ok) {
        console.error('❌ Failed to fetch students:', response.status, response.statusText)
        return []
      }
      const data = await response.json()
      // Ensure we always return an array
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('❌ Error fetching students:', error)
      return []
    }
  },

  // Get student by roll number
  async getStudentByRollNumber(rollNumber) {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${rollNumber}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch student')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching student:', error)
      return null
    }
  },

  // Get students by class
  async getStudentsByClass(className) {
    try {
      const response = await fetch(`${API_BASE_URL}/students/class/${className}`)
      if (!response.ok) throw new Error('Failed to fetch students by class')
      return await response.json()
    } catch (error) {
      console.error('Error fetching students by class:', error)
      return []
    }
  },

  // Add or update student
  async saveStudent(studentData) {
    try {
      console.log('📤 Sending student data to API:', JSON.stringify(studentData, null, 2))
      
      // Calculate results before sending
      const { total, percentage, grade, marks } = calculateResults(studentData)
      const studentWithResults = {
        ...studentData,
        ...marks,
        total,
        percentage,
        grade
      }

      console.log('📤 Final data being sent:', JSON.stringify(studentWithResults, null, 2))

      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentWithResults)
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response headers:', response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const result = await response.json()
      console.log('✅ API Success Response:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.error('❌ Error saving student:', error)
      console.error('❌ Error details:', error.message)
      return { success: false, error: error.message }
    }
  },

  // Delete student
  async deleteStudent(rollNumber) {
    try {
      const response = await fetch(`${API_BASE_URL}/students/${rollNumber}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        if (response.status === 404) return { success: false, error: 'Student not found' }
        throw new Error('Failed to delete student')
      }

      return await response.json()
    } catch (error) {
      console.error('Error deleting student:', error)
      return { success: false, error: error.message }
    }
  },

  // Get class statistics
  async getClassStatistics(className = null) {
    try {
      const url = className 
        ? `${API_BASE_URL}/stats/class/${className}`
        : `${API_BASE_URL}/stats/class`
      
      const response = await fetch(url)
      if (!response.ok) {
        console.error('❌ Failed to get class statistics:', response.status)
        return { avgPercentage: 0, passRate: 0, totalStudents: 0 }
      }
      const data = await response.json()
      return data || { avgPercentage: 0, passRate: 0, totalStudents: 0 }
    } catch (error) {
      console.error('❌ Error getting class statistics:', error)
      return { avgPercentage: 0, passRate: 0, totalStudents: 0 }
    }
  },

  // Get grade distribution
  async getGradeDistribution(className = null) {
    try {
      const url = className 
        ? `${API_BASE_URL}/stats/grades/${className}`
        : `${API_BASE_URL}/stats/grades`
      
      const response = await fetch(url)
      if (!response.ok) {
        console.error('❌ Failed to get grade distribution:', response.status)
        return { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 }
      }
      const data = await response.json()
      return data || { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 }
    } catch (error) {
      console.error('❌ Error getting grade distribution:', error)
      return { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 }
    }
  },

  // Get top students
  async getTopStudents(className = null, limit = 3) {
    try {
      const url = className 
        ? `${API_BASE_URL}/stats/top/${className}?limit=${limit}`
        : `${API_BASE_URL}/stats/top?limit=${limit}`
      
      const response = await fetch(url)
      if (!response.ok) {
        console.error('❌ Failed to get top students:', response.status)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('❌ Error getting top students:', error)
      return []
    }
  }
}

export default apiService
