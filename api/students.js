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

// Add or update student - handle GET and POST
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
  
  // Handle GET request - get all students
  if (req.method === 'GET') {
    try {
      // Connect to database
      await connectDB()
      
      if (!isConnected) {
        return res.status(500).json({ 
          error: 'Database connection failed',
          message: 'Unable to connect to MongoDB. Please check your connection string.',
          fallback: []
        })
      }
      
      const students = await Student.find({ isActive: true })
        .sort({ createdAt: -1 })
        .select('-__v -isActive')
      
      res.status(200).json(students)
    } catch (error) {
      console.error('Error fetching students:', error)
      res.status(500).json({ 
        error: 'Failed to fetch students', 
        details: error.message,
        fallback: []
      })
    }
    return
  }
  
  // Handle POST request - add/update student
  if (req.method === 'POST') {
    try {
      // Connect to database
      await connectDB()
      
      if (!isConnected) {
        return res.status(500).json({ 
          error: 'Database connection failed',
          message: 'Unable to connect to MongoDB. Please check your connection string.',
          fallback: { success: false }
        })
      }
      
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
      res.status(500).json({ 
        error: 'Failed to save student', 
        details: error.message,
        fallback: { success: false }
      })
    }
    return
  }
  
  // Handle other methods
  res.status(405).json({ error: 'Method not allowed. Use GET or POST' })
}
