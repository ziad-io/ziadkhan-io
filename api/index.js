// Default Vercel function - handles root path
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  res.json({
    message: 'GPS DMC Backend API',
    status: 'Running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      students: '/api/students-main',
      analytics: '/api/analytics',
      documentation: 'Backend API is working'
    },
    timestamp: new Date().toISOString(),
    vercel: {
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown'
    }
  })
}
