const mongoose = require('mongoose')

// MongoDB connection with retry logic
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gps_dmc_db'

let isConnected = false

const connectDB = async () => {
  if (isConnected) return
  
  try {
    await mongoose.connect(MONGODB_URI)
    isConnected = true
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    isConnected = false
  }
}

// Student Schema
const StudentSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true, unique: true },
  studentName: { type: String, required: true },
  fatherName: { type: String, required: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
  marks: {
    english: { type: Number, default: 0 },
    maths: { type: Number, default: 0 },
    science: { type: Number, default: 0 },
    urdu: { type: Number, default: 0 },
    islamiat: { type: Number, default: 0 },
    pashto: { type: Number, default: 0 }
  },
  results: {
    total: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String, default: 'F' }
  },
  examination: {
    year: { type: Number, default: 2026 },
    term: { type: String, default: 'Annual' }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema)

// Analytics endpoints - handle different query parameters
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { type, class: className, limit } = req.query
    console.log('Analytics request:', { type, className, limit })
    
    // Connect to database
    await connectDB()
    
    if (!isConnected) {
      return res.status(500).json({ 
        error: 'Database connection failed',
        message: 'Unable to connect to MongoDB. Please check your connection string.',
        fallback: {
          totalStudents: 0,
          avgPercentage: 0,
          passRate: 0
        }
      })
    }
    
    // Use real database data like local backend
    if (type === 'statistics') {
      const stats = await Student.getClassStatistics(className)
      if (stats.length === 0) {
        return res.json({
          totalStudents: 0,
          avgPercentage: 0,
          passRate: 0,
          message: 'No students found in database'
        })
      }
      return res.json(stats[0])
    }
    
    if (type === 'top-students') {
      const students = await Student.getTopStudents(className, parseInt(limit) || 3)
        .select('-__v -isActive -marks')
      return res.json(students)
    }
    
    if (type === 'grade-distribution') {
      const distribution = await Student.getGradeDistribution(className)
      const result = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 }
      distribution.forEach(item => {
        result[item._id] = item.count
      })
      return res.json(result)
    }
    
    return res.status(400).json({ error: 'Invalid analytics type. Use: statistics, top-students, or grade-distribution' })
  } catch (error) {
    console.error('Analytics API error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch analytics', 
      details: error.message 
    })
  }
}
