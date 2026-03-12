import { useState, useEffect } from 'react'
import './App.css'
import apiService from './services/api.js'
import Login from './Login.jsx'

function App() {
  // All useState hooks MUST be at the top
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('gps_dmc_logged_in') === 'true'
  })
  const [students, setStudents] = useState([])
  const [currentStudent, setCurrentStudent] = useState({
    rollNumber: '',
    studentName: '',
    fatherName: '',
    class: '1',
    section: 'A',
    english: '',
    maths: '',
    science: '',
    urdu: '',
    islamiat: '',
    pashto: ''
  })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchRollNumber, setSearchRollNumber] = useState('')
  const [selectedClass, setSelectedClass] = useState('All')
  const [isConnected, setIsConnected] = useState(false)
  const [stats, setStats] = useState({ avgPercentage: 0, passRate: 0, totalStudents: 0 })
  const [topStudents, setTopStudents] = useState([])
  const [gradeDistribution, setGradeDistribution] = useState({ 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 })
  const [notification, setNotification] = useState({ show: false, message: '', type: '' })

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' })
    }, 3000)
  }

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

  const calculateResults = () => {
    const marks = {
      english: parseInt(currentStudent.english) || 0,
      maths: parseInt(currentStudent.maths) || 0,
      science: parseInt(currentStudent.science) || 0,
      urdu: parseInt(currentStudent.urdu) || 0,
      islamiat: parseInt(currentStudent.islamiat) || 0,
      pashto: parseInt(currentStudent.pashto) || 0
    }
    
    const total = Object.values(marks).reduce((sum, mark) => sum + mark, 0)
    const percentage = (total / 550) * 100
    const grade = calculateGrade(percentage, marks)
    
    return { total, percentage, grade, marks }
  }

  const handleSave = async (e) => {
    // Prevent any default form submission
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    console.log('🚀 handleSave called')
    
    try {
      const { total, percentage, grade, marks } = calculateResults()
      console.log('📊 Calculated results:', { total, percentage, grade, marks })
      
      if (!currentStudent.rollNumber || !currentStudent.studentName || !currentStudent.fatherName) {
        alert('Please fill all required fields')
        return
      }
      
      const studentData = {
        ...currentStudent,
        ...marks,
        total,
        percentage,
        grade
      }
      
      console.log('📤 About to call apiService.saveStudent')
      const result = await apiService.saveStudent(studentData)
      console.log('📥 apiService.saveStudent result:', result)
      
      if (result && result.success) {
        console.log('✅ Save successful, reloading data...')
        console.log('🔄 Calling loadStudents...')
        await loadStudents()
        console.log('🔄 Calling loadAnalytics...')
        await loadAnalytics()
        console.log('✅ Data reload complete')
        console.log('📊 Current students state after reload:', students.length, 'students')
        
        // Clear form
        setCurrentStudent({
          rollNumber: '',
          studentName: '',
          fatherName: '',
          class: '1',
          section: 'A',
          english: '',
          maths: '',
          science: '',
          urdu: '',
          islamiat: '',
          pashto: ''
        })
        
        showNotification(result.message || 'Student record saved successfully!', 'success')
      } else {
        console.error('❌ Save failed:', result)
        showNotification(result?.error || 'Failed to save student record', 'error')
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR in handleSave:', error)
      console.error('❌ Error stack:', error.stack)
      showNotification('Error saving student: ' + error.message, 'error')
    }
  }

  const handleSearch = () => {
    const student = students.find(s => s.rollNumber === searchRollNumber)
    if (student) {
      setCurrentStudent(student)
      setActiveTab('dashboard')
    } else {
      showNotification('Student not found', 'error')
    }
  }

  const handleDelete = async (rollNumber) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        const result = await apiService.deleteStudent(rollNumber)
        if (result.success) {
          await loadStudents() // Reload students from database
          await loadAnalytics() // Reload analytics
          showNotification(result.message || 'Student record deleted successfully!', 'success')
        } else {
          showNotification(result.error || 'Failed to delete student record', 'error')
        }
      } catch (error) {
        console.error('Error deleting student:', error)
        showNotification('Error deleting student record', 'error')
      }
    }
  }

  const handleLoad = (student) => {
    setCurrentStudent(student)
    setActiveTab('dashboard')
  }

  const generateDMCHTML = () => {
    // Find the most recently saved student if current data is empty
    let studentToShow = currentStudent
    
    if (!studentToShow.rollNumber || !studentToShow.studentName || !studentToShow.fatherName) {
      // If current student is empty, try to get the last saved student
      if (students.length > 0) {
        studentToShow = students[students.length - 1]
      }
    }
    
    // If still no student data, show error message
    if (!studentToShow.rollNumber || !studentToShow.studentName || !studentToShow.fatherName) {
      return `
        <div class="dmc-container">
          <div class="dmc-header">
            <h1>GPS Kharkay</h1>
            <h2>Detailed Marks Certificate</h2>
          </div>
          <div class="dmc-error">
            <p>No student data available. Please enter student information first.</p>
            <p style="margin-top: 1rem; font-size: 1rem;">Go to Dashboard tab and enter student details, or search for an existing student.</p>
          </div>
        </div>
      `
    }

    // Calculate results for student we're showing
    // Handle both old flat structure and new nested marks structure
    const marks = {
      english: parseInt(studentToShow.marks?.english || studentToShow.english) || 0,
      maths: parseInt(studentToShow.marks?.maths || studentToShow.maths) || 0,
      science: parseInt(studentToShow.marks?.science || studentToShow.science) || 0,
      urdu: parseInt(studentToShow.marks?.urdu || studentToShow.urdu) || 0,
      islamiat: parseInt(studentToShow.marks?.islamiat || studentToShow.islamiat) || 0,
      pashto: parseInt(studentToShow.marks?.pashto || studentToShow.pashto) || 0
    }
    
    const total = Object.values(marks).reduce((sum, mark) => sum + mark, 0)
    const percentage = (total / 550) * 100
    const grade = calculateGrade(percentage, marks)
    
    // Helper to get mark value for display
    const getMark = (subject) => studentToShow.marks?.[subject] || studentToShow[subject] || '0'
    
    return `
      <div class="dmc-container">
        <div class="dmc-header-logos">
          <img src="/src/assets/kps logo.jpg" alt="KPS Logo" class="kps-logo" />
          <div class="dmc-header-title">
            <h1>GOVERNMENT PRIMARY SCHOOL KHARKAY</h1>
            <h2>Detailed Marks Certificate</h2>
            <h3>Annual Examination 2026 - Class ${studentToShow.class}</h3>
          </div>
          <img src="/src/assets/edu logo.jpg" alt="Education Logo" class="edu-logo" />
        </div>
        <div class="dmc-student-intro">
          <p>This is to certify that <strong>Mr. ${studentToShow.studentName}</strong> S/o <strong>${studentToShow.fatherName}</strong> bearing Admission No. <strong>${studentToShow.rollNumber}</strong> has secured marks against each subject in Annual examination held in 2026.</p>
        </div>
        <div class="dmc-marks">
          <table>
            <tr><th>Subject</th><th>Total Marks</th><th>Obtained Marks</th><th>Status</th></tr>
            <tr><td>English</td><td>100</td><td>${getMark('english')}</td><td>${(parseInt(getMark('english')) || 0) >= 33 ? 'PASS' : 'FAIL'}</td></tr>
            <tr><td>Science</td><td>100</td><td>${getMark('science')}</td><td>${(parseInt(getMark('science')) || 0) >= 33 ? 'PASS' : 'FAIL'}</td></tr>
            <tr><td>Urdu</td><td>100</td><td>${getMark('urdu')}</td><td>${(parseInt(getMark('urdu')) || 0) >= 33 ? 'PASS' : 'FAIL'}</td></tr>
            <tr><td>Mathematics</td><td>100</td><td>${getMark('maths')}</td><td>${(parseInt(getMark('maths')) || 0) >= 33 ? 'PASS' : 'FAIL'}</td></tr>
            <tr><td>Islamic Study</td><td>100</td><td>${getMark('islamiat')}</td><td>${(parseInt(getMark('islamiat')) || 0) >= 33 ? 'PASS' : 'FAIL'}</td></tr>
            <tr><td>Pashto</td><td>50</td><td>${getMark('pashto')}</td><td>${(parseInt(getMark('pashto')) || 0) >= 17 ? 'PASS' : 'FAIL'}</td></tr>
            <tr class="total-row"><td><strong>Total</strong></td><td><strong>550</strong></td><td><strong>${total}</strong></td><td><strong>${grade}</strong></td></tr>
          </table>
        </div>
        <div class="dmc-result-summary">
          <p><strong>Result:</strong> ${grade}</p>
          <p><strong>Percentage:</strong> ${percentage.toFixed(2)}%</p>
        </div>
        <div class="dmc-signatures">
          <div class="signature-left">
            <p>_____________________</p>
            <p>Class Teacher</p>
          </div>
          <div class="signature-right">
            <p>_____________________</p>
            <p>Headmaster/Headmistress</p>
          </div>
        </div>
      </div>
    `
  }

  const getClassStatistics = () => {
    const filteredStudents = selectedClass === 'All' 
      ? students 
      : students.filter(s => s.class === selectedClass)
    
    if (filteredStudents.length === 0) return { avgPercentage: 0, passRate: 0, totalStudents: 0 }
    
    const totalPercentage = filteredStudents.reduce((sum, s) => sum + s.percentage, 0)
    const passCount = filteredStudents.filter(s => s.grade !== 'F').length
    
    return {
      avgPercentage: (totalPercentage / filteredStudents.length).toFixed(2),
      passRate: ((passCount / filteredStudents.length) * 100).toFixed(2),
      totalStudents: filteredStudents.length
    }
  }

  const getTopStudents = () => {
    const filteredStudents = selectedClass === 'All' 
      ? students 
      : students.filter(s => s.class === selectedClass)
    
    return [...filteredStudents]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3)
  }

  const getGradeDistribution = () => {
    const filteredStudents = selectedClass === 'All' 
      ? students 
      : students.filter(s => s.class === selectedClass)
    
    const distribution = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 }
    filteredStudents.forEach(s => {
      distribution[s.grade]++
    })
    return distribution
  }

  useEffect(() => {
    const initializeApp = async () => {
      const health = await apiService.healthCheck()
      setIsConnected(health !== null)
      if (health) {
        loadStudents()
        loadAnalytics()
      }
    }
    
    initializeApp()
  }, [])

  useEffect(() => {
    if (isConnected) {
      loadAnalytics()
    }
  }, [selectedClass, students])

  const loadStudents = async () => {
    try {
      console.log('🔄 Loading students from API...')
      const studentsData = await apiService.getAllStudents()
      console.log('📥 Received students data:', studentsData)
      console.log('📊 Number of students:', studentsData?.length || 0)
      // Ensure we always have an array
      setStudents(Array.isArray(studentsData) ? studentsData : [])
    } catch (error) {
      console.error('❌ Error loading students:', error)
      setStudents([]) // Set empty array on error
    }
  }

  const loadAnalytics = async () => {
    try {
      console.log('🔄 Loading analytics for class:', selectedClass)
      const [statsData, topStudentsData, gradeData] = await Promise.all([
        apiService.getClassStatistics(selectedClass === 'All' ? null : selectedClass),
        apiService.getTopStudents(selectedClass === 'All' ? null : selectedClass, 3),
        apiService.getGradeDistribution(selectedClass === 'All' ? null : selectedClass)
      ])
      
      console.log('📊 Received stats data:', statsData)
      console.log('🏆 Received top students:', topStudentsData)
      console.log('📈 Received grade distribution:', gradeData)
      
      // Ensure we have valid data with defaults
      setStats(statsData || { avgPercentage: 0, passRate: 0, totalStudents: 0 })
      setTopStudents(topStudentsData || [])
      setGradeDistribution(gradeData || { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 })
    } catch (error) {
      console.error('Error loading analytics:', error)
      // Set default values on error
      setStats({ avgPercentage: 0, passRate: 0, totalStudents: 0 })
      setTopStudents([])
      setGradeDistribution({ 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('gps_dmc_logged_in')
    localStorage.removeItem('gps_dmc_user')
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>GPS KHARKAY DMC Management System</h1>
        <button onClick={handleLogout} className="logout-button">🚪 Logout</button>
      </header>
      
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <span className="notification-icon">{notification.type === 'success' ? '✅' : '❌'}</span>
          <span className="notification-message">{notification.message}</span>
          <button className="notification-close" onClick={() => setNotification({ show: false, message: '', type: '' })}>×</button>
        </div>
      )}
      
      <nav className="nav-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={activeTab === 'records' ? 'active' : ''}
          onClick={() => setActiveTab('records')}
        >
          Student Records
        </button>
        <button 
          className={activeTab === 'dmc' ? 'active' : ''}
          onClick={() => setActiveTab('dmc')}
        >
          DMC
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="student-form">
              <h2>Student Information</h2>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Roll Number *"
                  value={currentStudent.rollNumber}
                  onChange={(e) => setCurrentStudent({...currentStudent, rollNumber: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Student Name *"
                  value={currentStudent.studentName}
                  onChange={(e) => setCurrentStudent({...currentStudent, studentName: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Father Name *"
                  value={currentStudent.fatherName}
                  onChange={(e) => setCurrentStudent({...currentStudent, fatherName: e.target.value})}
                />
                <select
                  value={currentStudent.class}
                  onChange={(e) => setCurrentStudent({...currentStudent, class: e.target.value})}
                >
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                  <option value="4">Class 4</option>
                  <option value="5">Class 5</option>
                </select>
                <select
                  value={currentStudent.section}
                  onChange={(e) => setCurrentStudent({...currentStudent, section: e.target.value})}
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>
              
              <h3>Subject Marks</h3>
              <div className="marks-grid">
                <input
                  type="number"
                  placeholder="English (0-100)"
                  value={currentStudent.english}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || ''
                    if (val !== '' && val > 100) val = 100
                    if (val !== '' && val < 0) val = 0
                    setCurrentStudent({...currentStudent, english: val})
                  }}
                />
                <input
                  type="number"
                  placeholder="Science (0-100)"
                  value={currentStudent.science}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || ''
                    if (val !== '' && val > 100) val = 100
                    if (val !== '' && val < 0) val = 0
                    setCurrentStudent({...currentStudent, science: val})
                  }}
                />
                <input
                  type="number"
                  placeholder="Urdu (0-100)"
                  value={currentStudent.urdu}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || ''
                    if (val !== '' && val > 100) val = 100
                    if (val !== '' && val < 0) val = 0
                    setCurrentStudent({...currentStudent, urdu: val})
                  }}
                />
                <input
                  type="number"
                  placeholder="Maths (0-100)"
                  value={currentStudent.maths}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || ''
                    if (val !== '' && val > 100) val = 100
                    if (val !== '' && val < 0) val = 0
                    setCurrentStudent({...currentStudent, maths: val})
                  }}
                />
                <input
                  type="number"
                  placeholder="Islamic Study (0-100)"
                  value={currentStudent.islamiat}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || ''
                    if (val !== '' && val > 100) val = 100
                    if (val !== '' && val < 0) val = 0
                    setCurrentStudent({...currentStudent, islamiat: val})
                  }}
                />
                <input
                  type="number"
                  placeholder="Pashto (0-50)"
                  value={currentStudent.pashto}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || ''
                    if (val !== '' && val > 50) val = 50
                    if (val !== '' && val < 0) val = 0
                    setCurrentStudent({...currentStudent, pashto: val})
                  }}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={handleSave} className="btn-primary">SAVE</button>
                <button onClick={() => {
                  if (!currentStudent.rollNumber || !currentStudent.studentName || !currentStudent.fatherName) {
                    alert('Please enter student information first before generating DMC')
                    return
                  }
                  setActiveTab('dmc')
                  setTimeout(() => {
                    window.print()
                  }, 100)
                }} className="btn-secondary">PRINT DMC</button>
              </div>
            </div>

            <div className="analytics">
              <div className="class-filter">
                <label>Filter by Class:</label>
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="class-select"
                >
                  <option value="All">All Classes</option>
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                  <option value="4">Class 4</option>
                  <option value="5">Class 5</option>
                </select>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Class Statistics</h3>
                  <p>Total Students: {stats.totalStudents}</p>
                  <p>Average Percentage: {stats.avgPercentage}%</p>
                  <p>Pass Rate: {stats.passRate}%</p>
                  {selectedClass !== 'All' && <p>Class: {selectedClass}</p>}
                </div>
                
                <div className="stat-card">
                  <h3>Top 3 Students</h3>
                  {topStudents && topStudents.length > 0 ? (
                    topStudents.map((student, index) => (
                      <p key={student.rollNumber || index}>
                        {index + 1}. {student.studentName || 'Unknown'} ({((student.results?.percentage || student.percentage) || 0).toFixed(2)}%)
                      </p>
                    ))
                  ) : (
                    <p>No students available</p>
                  )}
                </div>
                
                <div className="stat-card">
                  <h3>Grade Distribution</h3>
                  {Object.entries(gradeDistribution).map(([grade, count]) => (
                    <p key={grade}>{grade}: {count}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="search-section">
              <h3>Search Student</h3>
              <div className="search-form">
                <input
                  type="text"
                  placeholder="Enter Roll Number"
                  value={searchRollNumber}
                  onChange={(e) => setSearchRollNumber(e.target.value)}
                />
                <button onClick={handleSearch}>SEARCH</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="records">
            <h2>Student Records</h2>
            <div className="class-filter">
              <label>Filter by Class:</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="class-select"
              >
                <option value="All">All Classes</option>
                <option value="1">Class 1</option>
                <option value="2">Class 2</option>
                <option value="3">Class 3</option>
                <option value="4">Class 4</option>
                <option value="5">Class 5</option>
              </select>
            </div>
            <div className="records-table">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Father Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Total</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students && (selectedClass === 'All' ? students : students.filter(s => s.class === selectedClass)).map(student => (
                    <tr key={student.rollNumber || Math.random()}>
                      <td>{student.rollNumber || '-'}</td>
                      <td>{student.studentName || '-'}</td>
                      <td>{student.fatherName || '-'}</td>
                      <td>{student.class || '-'}</td>
                      <td>{student.section || '-'}</td>
                      <td>{student.results?.total || student.total || 0}</td>
                      <td>{((student.results?.percentage || student.percentage) || 0).toFixed(2)}%</td>
                      <td>{student.results?.grade || student.grade || '-'}</td>
                      <td>
                        <button onClick={() => handleLoad(student)} className="btn-small">Load</button>
                        <button onClick={() => handleDelete(student.rollNumber)} className="btn-small btn-danger">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(selectedClass === 'All' ? students : students.filter(s => s.class === selectedClass)).length === 0 && <p>No student records found.</p>}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics">
            <h2>Analytics Dashboard</h2>
            <div className="class-filter">
              <label>Filter by Class:</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="class-select"
              >
                <option value="All">All Classes</option>
                <option value="1">Class 1</option>
                <option value="2">Class 2</option>
                <option value="3">Class 3</option>
                <option value="4">Class 4</option>
                <option value="5">Class 5</option>
              </select>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Class Statistics</h3>
                <p>Total Students: {stats.totalStudents}</p>
                <p>Average Percentage: {stats.avgPercentage}%</p>
                <p>Pass Rate: {stats.passRate}%</p>
              </div>
              <div className="stat-card">
                <h3>Top Students</h3>
                {topStudents.length > 0 ? (
                  <ul>
                    {topStudents.map((student, index) => (
                      <li key={student.rollNumber || index}>
                        {student.rollNumber} - {student.studentName} ({student.results?.percentage || 0}%)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No students found</p>
                )}
              </div>
              <div className="stat-card">
                <h3>Grade Distribution</h3>
                {Object.entries(gradeDistribution).map(([grade, count]) => (
                  <div key={grade} className="grade-bar">
                    <span>{grade}: </span>
                    <div className="bar">
                      <div 
                        className="fill" 
                        style={{ 
                          width: `${stats.totalStudents > 0 ? (count / stats.totalStudents) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dmc' && (
          <div className="dmc-view">
            <div className="dmc-controls">
              <h2>DMC Certificate</h2>
              <div className="dmc-actions">
                <select onChange={(e) => {
                  if (e.target.value) {
                    const student = students.find(s => s.rollNumber === e.target.value)
                    if (student) {
                      setCurrentStudent(student)
                    }
                  }
                }} className="student-select">
                  <option value="">Select Student for DMC</option>
                  {students && students.map(student => (
                    <option key={student.rollNumber || Math.random()} value={student.rollNumber}>
                      {student.rollNumber || '-'} - {student.studentName || 'Unknown'}
                    </option>
                  ))}
                </select>
                <button onClick={() => window.print()} className="btn-secondary">Print DMC</button>
              </div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: generateDMCHTML() }} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
