import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Student from './models/Student.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// MongoDB Connection with Mongoose
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gps_dmc_db'

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB with Mongoose')
    console.log(`📊 Database: ${mongoose.connection.name}`)
    return true
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    return false
  }
}

// Initialize database connection
connectToDatabase()

// MongoDB Connection Events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB')
})

// API Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'GPS DMC Backend is running with Mongoose',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  })
})

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('-__v -isActive')
    
    res.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

// Get student by roll number
app.get('/api/students/:rollNumber', async (req, res) => {
  try {
    const { rollNumber } = req.params
    const student = await Student.findOne({ 
      rollNumber: rollNumber, 
      isActive: true 
    }).select('-__v -isActive')
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    res.json(student)
  } catch (error) {
    console.error('Error fetching student:', error)
    res.status(500).json({ error: 'Failed to fetch student' })
  }
})

// Get students by class
app.get('/api/students/class/:className', async (req, res) => {
  try {
    const { className } = req.params
    
    // Validate class
    if (!['1', '2', '3', '4', '5'].includes(className)) {
      return res.status(400).json({ error: 'Invalid class. Must be 1-5' })
    }
    
    const students = await Student.findByClass(className)
      .sort({ 'results.percentage': -1 })
      .select('-__v -isActive')
    
    res.json(students)
  } catch (error) {
    console.error('Error fetching students by class:', error)
    res.status(500).json({ error: 'Failed to fetch students by class' })
  }
})

// Add or update student
app.post('/api/students', async (req, res) => {
  try {
    console.log('📝 Add or update student request received')
    const studentData = req.body
    console.log('📝 Received student data:', JSON.stringify(studentData, null, 2))
    
    // Validate required fields
    if (!studentData.rollNumber || !studentData.studentName || !studentData.fatherName) {
      console.log('❌ Validation failed: Missing required fields')
      return res.status(400).json({ 
        error: 'Missing required fields: rollNumber, studentName, fatherName' 
      })
    }
    
    // Validate class
    if (!['1', '2', '3', '4', '5'].includes(studentData.class)) {
      console.log('❌ Validation failed: Invalid class')
      return res.status(400).json({ error: 'Invalid class. Must be 1-5' })
    }
    
    // Validate section
    if (!['A', 'B'].includes(studentData.section)) {
      console.log('❌ Validation failed: Invalid section')
      return res.status(400).json({ error: 'Invalid section. Must be A or B' })
    }
    
    // Structure the data for Mongoose schema
    const structuredData = {
      rollNumber: studentData.rollNumber,
      studentName: studentData.studentName,
      fatherName: studentData.fatherName,
      class: studentData.class,
      section: studentData.section || 'A',
      marks: {
        english: parseInt(studentData.english) || 0,
        maths: parseInt(studentData.maths) || 0,
        science: parseInt(studentData.science) || 0,
        urdu: parseInt(studentData.urdu) || 0,
        islamiat: parseInt(studentData.islamiat) || 0,
        pashto: parseInt(studentData.pashto) || 0
      },
      results: {
        total: parseInt(studentData.total) || 0,
        percentage: parseFloat(studentData.percentage) || 0,
        grade: studentData.grade || 'F'
      },
      examination: {
        year: studentData.examination?.year || 2026,
        term: studentData.examination?.term || 'Annual'
      }
    }
    
    console.log('📋 Structured data for database:', JSON.stringify(structuredData, null, 2))
    
    const { rollNumber } = studentData
    
    // Check if student exists and update or create
    const student = await Student.findOneAndUpdate(
      { rollNumber: rollNumber },
      structuredData,
      { 
        new: true, 
        upsert: true, 
        runValidators: true,
        setDefaultsOnInsert: true 
      }
    ).select('-__v -isActive')
    
    console.log('✅ Student saved to database:', student.rollNumber)
    console.log('📊 Database response:', JSON.stringify(student, null, 2))
    
    res.json({ 
      success: true, 
      message: student.isNew ? 'Student added successfully' : 'Student updated successfully',
      data: student
    })
  } catch (error) {
    console.error('❌ Error saving student:', error)
    console.error('❌ Error stack:', error.stack)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      console.log('❌ Validation errors:', errors)
      return res.status(400).json({ error: 'Validation failed', details: errors })
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      console.log('❌ Duplicate key error')
      return res.status(400).json({ error: 'Roll number already exists' })
    }
    
    res.status(500).json({ error: 'Failed to save student', details: error.message })
  }
})

// Delete student (soft delete)
app.delete('/api/students/:rollNumber', async (req, res) => {
  try {
    console.log('📝 Delete student request received:', req.params.rollNumber)
    const { rollNumber } = req.params
    
    const student = await Student.findOneAndUpdate(
      { rollNumber: rollNumber, isActive: true },
      { isActive: false },
      { new: true }
    )
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    console.log(`✅ Student deleted: ${rollNumber}`)
    res.json({ success: true, message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Error deleting student:', error)
    res.status(500).json({ error: 'Failed to delete student' })
  }
})

// Get class statistics
app.get('/api/stats/class/:className?', async (req, res) => {
  try {
    const { className } = req.params
    
    if (className && !['1', '2', '3', '4', '5'].includes(className)) {
      return res.status(400).json({ error: 'Invalid class. Must be 1-5' })
    }
    
    const stats = await Student.getClassStatistics(className)
    
    if (stats.length === 0) {
      return res.json({ 
        avgPercentage: 0, 
        passRate: 0, 
        totalStudents: 0 
      })
    }
    
    res.json(stats[0])
  } catch (error) {
    console.error('Error getting class statistics:', error)
    res.status(500).json({ error: 'Failed to get class statistics' })
  }
})

// Get grade distribution
app.get('/api/stats/grades/:className?', async (req, res) => {
  try {
    const { className } = req.params
    
    if (className && !['1', '2', '3', '4', '5'].includes(className)) {
      return res.status(400).json({ error: 'Invalid class. Must be 1-5' })
    }
    
    const distribution = await Student.getGradeDistribution(className)
    
    // Convert array to object format
    const result = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 }
    distribution.forEach(item => {
      result[item._id] = item.count
    })
    
    res.json(result)
  } catch (error) {
    console.error('Error getting grade distribution:', error)
    res.status(500).json({ error: 'Failed to get grade distribution' })
  }
})

// Get top students
app.get('/api/stats/top/:className?', async (req, res) => {
  try {
    const { className } = req.params
    const limit = parseInt(req.query.limit) || 3
    
    if (className && !['1', '2', '3', '4', '5'].includes(className)) {
      return res.status(400).json({ error: 'Invalid class. Must be 1-5' })
    }
    
    const students = await Student.getTopStudents(className, limit)
      .select('-__v -isActive -marks')
    
    res.json(students)
  } catch (error) {
    console.error('Error getting top students:', error)
    res.status(500).json({ error: 'Failed to get top students' })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GPS DMC Backend Server running on port ${PORT}`)
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`)
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`)
  console.log(`🗄️  MongoDB URI: ${MONGODB_URI}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...')
  try {
    await mongoose.connection.close()
    console.log('✅ MongoDB connection closed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during shutdown:', error)
    process.exit(1)
  }
})

export default app
