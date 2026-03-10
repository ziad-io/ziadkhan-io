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

// Health check
module.exports = async (req, res) => {
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
}
