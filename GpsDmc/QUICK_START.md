# GPS DMC System - Quick Start Guide

## 🚀 System Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │──────│     Backend      │──────│    MongoDB      │
│   (GpsDmc)      │      │   (my-backend)   │      │   (Database)    │
│   Port: 5173    │      │    Port: 5000    │      │  Port: 27017    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                        │                        │
    React + Vite           Express + Mongoose       MongoDB Server
```

## 📋 Prerequisites

1. **Node.js** installed (v16 or higher)
2. **MongoDB** running on `localhost:27017`
3. **npm** or **yarn** package manager

## 🎯 How to Start the System

### Step 1: Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Check if MongoDB is running
mongo --eval "db.version()"

# Or start MongoDB service
net start MongoDB   # Windows
sudo service mongod start  # Linux/Mac
```

### Step 2: Start Backend Server
```bash
cd d:\AutoDmc\my-backend
npm start
```

**Expected Output:**
```
✅ Connected to MongoDB with Mongoose
📊 Database: gps_dmc_db
🚀 GPS DMC Backend Server running on port 5000
📊 API Base URL: http://localhost:5000/api
🔗 Health Check: http://localhost:5000/api/health
🗄️  MongoDB URI: mongodb://localhost:27017/gps_dmc_db
```

### Step 3: Start Frontend
Open a **new terminal** and run:
```bash
cd d:\AutoDmc\GpsDmc
npm run dev
```

**Expected Output:**
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### Step 4: Open Browser
Navigate to: **http://localhost:5173/**

## ✅ Features Now Available

### 🎓 Student Management
- ✅ Add students with marks
- ✅ Edit existing students
- ✅ Delete students (soft delete)
- ✅ Search by roll number
- ✅ Filter by class (1-5)

### 📊 Analytics & Reports
- ✅ Real-time class statistics
- ✅ Grade distribution charts
- ✅ Top students ranking
- ✅ Pass/Fail calculations

### 🎨 DMC Generation
- ✅ Professional certificate design
- ✅ School logos (KPS & Education)
- ✅ 2026 examination year
- ✅ Automatic grade calculation
- ✅ Print-ready format

### 🔧 Technical Features
- ✅ MongoDB database storage
- ✅ RESTful API architecture
- ✅ Real-time data synchronization
- ✅ Error handling & validation
- ✅ Soft delete functionality
- ✅ Indexing for performance

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server status |
| `/api/students` | GET | All students |
| `/api/students` | POST | Add/Update student |
| `/api/students/:roll` | DELETE | Delete student |
| `/api/stats/class/:class` | GET | Class statistics |
| `/api/stats/grades/:class` | GET | Grade distribution |
| `/api/stats/top/:class` | GET | Top students |

## 🛠️ Database Schema

**Database:** `gps_dmc_db`  
**Collection:** `students`

```javascript
{
  rollNumber: String (unique),
  studentName: String,
  fatherName: String,
  class: String (1-5),
  section: String (A/B),
  marks: {
    english: Number,
    maths: Number,
    science: Number,
    urdu: Number,
    islamiat: Number,
    pashto: Number
  },
  results: {
    total: Number,
    percentage: Number,
    grade: String (A+, A, B, C, D, F)
  },
  examination: {
    year: Number,
    term: String
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## ⚠️ Troubleshooting

### Backend Won't Start
```bash
# Check if dependencies are installed
cd my-backend
npm install

# Check if MongoDB is running
mongo --eval "db.version()"
```

### Frontend Won't Connect
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Restart frontend dev server
cd GpsDmc
npm run dev
```

### MongoDB Connection Error
```bash
# Windows: Start MongoDB service
net start MongoDB

# Check MongoDB status
mongo --eval "db.serverStatus()"
```

## 📝 File Structure

```
D:\AutoDmc\
├── GpsDmc\                    # Frontend (React + Vite)
│   ├── src\
│   │   ├── services\
│   │   │   └── api.js         # API service layer
│   │   ├── App.jsx            # Main app component
│   │   └── App.css            # Styles
│   ├── package.json
│   └── vite.config.js
│
├── my-backend\                # Backend (Express + Mongoose)
│   ├── models\
│   │   └── Student.js         # Mongoose schema
│   ├── server.js              # Express server
│   ├── package.json
│   ├── .env                   # Environment variables
│   └── README.md
│
└── README.md                   # This file
```

## 🎉 System is Ready!

The GPS DMC Management System is now fully connected with:
- ✅ Frontend (React) ↔ Backend (Express) ↔ Database (MongoDB)
- ✅ Complete student management
- ✅ DMC certificate generation
- ✅ Analytics and reporting
- ✅ Professional document structure

**Start both servers and begin using the system!** 🚀
