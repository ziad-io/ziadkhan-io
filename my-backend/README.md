# GPS DMC Backend API

Backend API server for GPS Harkay DMC Management System with MongoDB integration.

## Features

- **RESTful API** for student data management
- **MongoDB** integration for persistent storage
- **CORS** enabled for frontend integration
- **Real-time analytics** and statistics
- **Class-based filtering** (Class 1-5)
- **Grade calculation** with business logic
- **Health check** endpoint

## API Endpoints

### Health Check
```
GET /api/health
```

### Students Management
```
GET    /api/students              # Get all students
GET    /api/students/:rollNumber  # Get student by roll number
GET    /api/students/class/:class # Get students by class
POST   /api/students              # Add/update student
DELETE /api/students/:rollNumber  # Delete student
```

### Statistics & Analytics
```
GET /api/stats/class/:class?      # Get class statistics
GET /api/stats/grades/:class?     # Get grade distribution
GET /api/stats/top/:class?        # Get top students
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running on localhost:27017)

### Install Dependencies
```bash
cd my-backend
npm install
```

### Environment Configuration
Copy `.env` file and update if needed:
```env
MONGODB_URI=mongodb://localhost:27017/
PORT=5000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Start Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## API Usage Examples

### Add Student
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "rollNumber": "001",
    "studentName": "John Doe",
    "fatherName": "Father Name",
    "class": "5",
    "section": "A",
    "english": "85",
    "maths": "90",
    "science": "78",
    "urdu": "82",
    "islamiat": "88",
    "pashto": "45"
  }'
```

### Get All Students
```bash
curl http://localhost:5000/api/students
```

### Get Class Statistics
```bash
curl http://localhost:5000/api/stats/class/5
```

## Database Schema

### Student Document
```javascript
{
  _id: ObjectId,
  rollNumber: String,
  studentName: String,
  fatherName: String,
  class: String (1-5),
  section: String (A/B),
  english: Number,
  maths: Number,
  science: Number,
  urdu: Number,
  islamiat: Number,
  pashto: Number,
  total: Number,
  percentage: Number,
  grade: String (A+, A, B, C, D, F),
  createdAt: Date,
  updatedAt: Date
}
```

## Grade Calculation Logic

### Subject Pass Criteria
- **33% minimum** for each subject (17/50 for Pashto)
- **Fail if 2+ subjects** below 33%
- **Pass if 0-1 subjects** below 33%

### Grade Scale
| Grade | Percentage | Performance |
|-------|------------|-------------|
| A+    | 90-100%    | Excellent   |
| A     | 80-89%     | Very Good   |
| B     | 70-79%     | Good        |
| C     | 60-69%     | Average     |
| D     | 50-59%     | Pass        |
| F     | <50%       | Fail        |

## Error Handling

All API endpoints return consistent error responses:
```javascript
{
  "error": "Error message description"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Frontend Integration

Update your frontend to use these API endpoints instead of direct MongoDB connection:

```javascript
// Example: Fetch all students
const response = await fetch('http://localhost:5000/api/students')
const students = await response.json()

// Example: Save student
const response = await fetch('http://localhost:5000/api/students', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(studentData)
})
```

## Development

### Project Structure
```
my-backend/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── .env              # Environment variables
├── README.md         # Documentation
└── node_modules/     # Installed dependencies
```

### Logging
- Server startup/shutdown messages
- API request logging
- Error logging with timestamps
- Database operation status

## Security Considerations

- CORS configured for specific origin
- Input validation on required fields
- MongoDB connection with proper error handling
- Graceful shutdown on process termination

## License

MIT License
