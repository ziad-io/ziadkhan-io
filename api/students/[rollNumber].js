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

// Delete student
module.exports = async (req, res) => {
  if (req.method === 'DELETE') {
    try {
      const { rollNumber } = req.query
      
      if (!rollNumber) {
        return res.status(400).json({ error: 'Roll number is required' })
      }
      
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
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
