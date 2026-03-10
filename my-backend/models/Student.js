import mongoose from 'mongoose'

// Student Schema with proper document structure
const studentSchema = new mongoose.Schema({
  // Basic Information
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Class Information
  class: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4', '5']
  },
  section: {
    type: String,
    required: true,
    enum: ['A', 'B'],
    default: 'A'
  },
  
  // Subject Marks (English, Maths, Science, Urdu, Islamic Study, Pashto)
  marks: {
    english: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    maths: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    science: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    urdu: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    islamiat: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    pashto: {
      type: Number,
      required: true,
      min: 0,
      max: 50
    }
  },
  
  // Calculated Results
  results: {
    total: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    grade: {
      type: String,
      required: true,
      enum: ['A+', 'A', 'B', 'C', 'D', 'F']
    }
  },
  
  // Examination Details
  examination: {
    year: {
      type: Number,
      default: 2026
    },
    term: {
      type: String,
      default: 'Annual'
    }
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'students'
})

// Indexes for better performance
studentSchema.index({ rollNumber: 1 })
studentSchema.index({ class: 1, section: 1 })
studentSchema.index({ 'results.grade': 1 })
studentSchema.index({ 'results.percentage': -1 })

// Virtual for formatted roll number
studentSchema.virtual('formattedRollNumber').get(function() {
  return this.rollNumber.toString().padStart(3, '0')
})

// Virtual for pass/fail status
studentSchema.virtual('status').get(function() {
  return this.results.grade === 'F' ? 'Fail' : 'Pass'
})

// Pre-save middleware to calculate results
studentSchema.pre('save', function(next) {
  if (this.isModified('marks')) {
    const marks = this.marks
    const total = Object.values(marks).reduce((sum, mark) => sum + mark, 0)
    const percentage = (total / 550) * 100
    
    // Calculate grade
    const failCount = Object.values(marks).filter(mark => {
      const maxMark = mark === marks.pashto ? 50 : 100
      return mark < (maxMark * 0.33) // 33% pass criteria
    }).length
    
    let grade
    if (failCount >= 2) {
      grade = 'F'
    } else if (percentage >= 90) {
      grade = 'A+'
    } else if (percentage >= 80) {
      grade = 'A'
    } else if (percentage >= 70) {
      grade = 'B'
    } else if (percentage >= 60) {
      grade = 'C'
    } else if (percentage >= 50) {
      grade = 'D'
    } else {
      grade = 'F'
    }
    
    this.results = { total, percentage, grade }
  }
  
  this.updatedAt = new Date()
  next()
})

// Static methods
studentSchema.statics.findByClass = function(className) {
  return this.find({ class: className, isActive: true })
}

studentSchema.statics.getTopStudents = function(className = null, limit = 3) {
  const filter = className ? { class: className, isActive: true } : { isActive: true }
  return this.find(filter)
    .sort({ 'results.percentage': -1 })
    .limit(limit)
}

studentSchema.statics.getGradeDistribution = function(className = null) {
  const filter = className ? { class: className, isActive: true } : { isActive: true }
  return this.aggregate([
    { $match: filter },
    { $group: { _id: '$results.grade', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ])
}

studentSchema.statics.getClassStatistics = function(className = null) {
  const filter = className ? { class: className, isActive: true } : { isActive: true }
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        avgPercentage: { $avg: '$results.percentage' },
        passCount: {
          $sum: {
            $cond: [{ $ne: ['$results.grade', 'F'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        totalStudents: 1,
        avgPercentage: { $round: ['$avgPercentage', 2] },
        passRate: {
          $round: [
            { $multiply: [{ $divide: ['$passCount', '$totalStudents'] }, 100] },
            2
          ]
        }
      }
    }
  ])
}

// Instance methods
studentSchema.methods.toAPIResponse = function() {
  const obj = this.toObject()
  delete obj.__v
  delete obj.isActive
  return obj
}

const Student = mongoose.model('Student', studentSchema)

export default Student
