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

// Add or update student
module.exports = async (req, res) => {
  // Handle different HTTP methods
  if (req.method === 'GET') {
    try {
      const students = await Student.find({ isActive: true })
        .sort({ createdAt: -1 })
        .select('-__v -isActive')
      
      res.status(200).json(students)
    } catch (error) {
      console.error('Error fetching students:', error)
      res.status(500).json({ error: 'Failed to fetch students' })
    }
  }
  
  if (req.method === 'POST') {
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
  }
}
