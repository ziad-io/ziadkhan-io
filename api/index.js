const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

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

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping()
    res.status(200).json({ 
      status: 'healthy', 
      message: 'GPS DMC Backend API is running',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      message: 'Database connection failed',
      error: error.message 
    })
  }
})

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('-__v -isActive')
    
    res.status(200).json(students)
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
    
    res.status(200).json(student)
  } catch (error) {
    console.error('Error fetching student:', error)
    res.status(500).json({ error: 'Failed to fetch student' })
  }
})

// Add or update student
app.post('/api/students', async (req, res) => {
  try {
    const studentData = req.body
    
    if (!studentData.rollNumber || !studentData.studentName || !studentData.fatherName) {
      return res.status(400).json({ error: 'Missing required fields: rollNumber, studentName, fatherName' })
    }
    
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
    
    const student = await Student.findOneAndUpdate(
      { rollNumber: studentData.rollNumber },
      structuredData,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).select('-__v -isActive')
    
    res.json({
      success: true,
      message: student.isNew ? 'Student added successfully' : 'Student updated successfully',
      data: student
    })
  } catch (error) {
    console.error('Error saving student:', error)
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: 'Validation failed', details: errors })
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Roll number already exists' })
    }
    res.status(500).json({ error: 'Failed to save student', details: error.message })
  }
})

// Delete student
app.delete('/api/students/:rollNumber', async (req, res) => {
  try {
    const { rollNumber } = req.params
    
    const student = await Student.findOneAndUpdate(
      { rollNumber: rollNumber },
      { isActive: false },
      { new: true }
    )
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting student:', error)
    res.status(500).json({ error: 'Failed to delete student' })
  }
})

// Analytics endpoints
app.get('/api/analytics/statistics', async (req, res) => {
  try {
    const classFilter = req.query.class ? { class: req.query.class } : {}
    
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
    
    res.json({
      totalStudents,
      avgPercentage: parseFloat(avgPercentage),
      passRate: parseFloat(passRate)
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

app.get('/api/analytics/top-students', async (req, res) => {
  try {
    const classFilter = req.query.class ? { class: req.query.class } : {}
    const limit = parseInt(req.query.limit) || 3
    
    const topStudents = await Student.find({ ...classFilter, isActive: true })
      .sort({ 'results.percentage': -1 })
      .limit(limit)
      .select('studentName rollNumber class results')
    
    res.json(topStudents)
  } catch (error) {
    console.error('Error fetching top students:', error)
    res.status(500).json({ error: 'Failed to fetch top students' })
  }
})

app.get('/api/analytics/grade-distribution', async (req, res) => {
  try {
    const classFilter = req.query.class ? { class: req.query.class } : {}
    
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
    
    res.json(gradeCounts)
  } catch (error) {
    console.error('Error fetching grade distribution:', error)
    res.status(500).json({ error: 'Failed to fetch grade distribution' })
  }
})

// Export for Vercel
module.exports = app
