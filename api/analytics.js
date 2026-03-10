const mongoose = require('mongoose')

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gps_dmc_db'

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

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
    
    // Get class statistics
    if (type === 'statistics') {
      const classFilter = className ? { class: className } : {}
      
      const students = await Student.find({ ...classFilter, isActive: true })
      
      if (students.length === 0) {
        return res.json({
          totalStudents: 0,
          avgPercentage: 0,
          passRate: 0
        })
      }
      
      const totalStudents = students.length
      const totalPercentage = students.reduce((sum, s) => sum + (s.results?.percentage || 0), 0)
      const avgPercentage = (totalPercentage / totalStudents).toFixed(2)
      
      const passCount = students.filter(s => s.results?.grade !== 'F').length
      const passRate = ((passCount / totalStudents) * 100).toFixed(2)
      
      return res.json({
        totalStudents,
        avgPercentage: parseFloat(avgPercentage),
        passRate: parseFloat(passRate)
      })
    }
    
    // Get top students
    if (type === 'top-students') {
      const classFilter = className ? { class: className } : {}
      const studentLimit = parseInt(limit) || 3
      
      const topStudents = await Student.find({ ...classFilter, isActive: true })
        .sort({ 'results.percentage': -1 })
        .limit(studentLimit)
        .select('studentName rollNumber class results')
      
      return res.json(topStudents)
    }
    
    // Get grade distribution
    if (type === 'grade-distribution') {
      const classFilter = className ? { class: className } : {}
      
      const students = await Student.find({ ...classFilter, isActive: true })
      
      const gradeCounts = {
        'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0
      }
      
      students.forEach(s => {
        const grade = s.results?.grade || 'F'
        if (gradeCounts.hasOwnProperty(grade)) {
          gradeCounts[grade]++
        }
      })
      
      return res.json(gradeCounts)
    }
    
    res.status(400).json({ error: 'Invalid analytics type. Use: statistics, top-students, or grade-distribution' })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message })
  }
}
