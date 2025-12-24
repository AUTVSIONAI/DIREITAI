const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const Stripe = require('stripe')
const { exec } = require('child_process')
const path = require('path')
require('dotenv').config()

const PORT = process.env.API_PORT || 5120
const app = express()

// Middleware
app.use(cors({ origin: true, credentials: true }))
app.use(bodyParser.json())

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// --- Mock Data Generators ---

const mockUsers = Array.from({ length: 20 }, (_, i) => ({
  id: `user-${i + 1}`,
  email: `user${i + 1}@example.com`,
  username: `user_${i + 1}`,
  full_name: `User ${i + 1}`,
  role: i === 0 ? 'admin' : 'user',
  plan: i < 5 ? 'premium' : 'free',
  status: 'active',
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
  last_login: new Date().toISOString()
}))

const mockNotifications = Array.from({ length: 5 }, (_, i) => ({
  id: `notif-${i}`,
  title: `Notification ${i + 1}`,
  message: `This is a test notification ${i + 1}`,
  read: false,
  created_at: new Date().toISOString(),
  type: 'info'
}))

const mockEvents = [
  {
    id: 'evt-1',
    title: 'Evento Conservador 2024',
    date: new Date(Date.now() + 86400000).toISOString(),
    location: 'São Paulo, SP',
    status: 'active',
    participants: 150
  }
]

// Mock Politicians Data
let mockPoliticians = [
  {
    id: 'pol-1',
    name: 'João da Silva',
    party: 'PL',
    position: 'Vereador',
    city: 'São Paulo',
    state: 'SP',
    photo_url: 'https://via.placeholder.com/150',
    bio: 'Vereador conservador focado em segurança pública.',
    status: 'approved',
    expenses_visible: true,
    voice_config: {
      provider: 'local',
      api_url: 'http://localhost:8005',
      voice_id: 'default',
      settings: { stability: 0.5, similarity_boost: 0.75 }
    }
  }
]

// --- Helper Functions ---

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  try { return new Stripe(key) } catch { return null }
}

const parseRange = (req) => {
  const start = req.query.start_date
  const end = req.query.end_date
  const toEpoch = (d) => Math.floor(new Date(d).getTime() / 1000)
  const created = {}
  if (start) created.gte = toEpoch(start)
  if (end) created.lte = toEpoch(end)
  return created
}

const requireStripe = (req, res, next) => {
  const stripe = getStripe()
  if (!stripe) {
    // If no Stripe key, return mock financial data instead of 401/500 to keep UI working
    req.stripe = null
    // We allow passing through, but endpoints must handle req.stripe === null
    next()
  } else {
    req.stripe = stripe
    next()
  }
}

// --- Docker Control Endpoints ---

const DOCKER_CONTAINER_NAME = 'direitaai-voice'

const runDockerCommand = (command, cwd = null) => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.warn(`Docker command error: ${error.message}`)
        resolve({ success: false, error: error.message, output: stderr || error.message })
      } else {
        resolve({ success: true, output: stdout })
      }
    })
  })
}

app.get('/api/admin/docker/status', async (req, res) => {
  // Check if container is running
  const { success, output } = await runDockerCommand(`docker inspect -f "{{.State.Running}}" ${DOCKER_CONTAINER_NAME}`)
  
  // If inspect fails, container might not exist or docker is down
  if (!success) {
    return res.json({ 
      success: true, 
      status: 'stopped', 
      details: 'Container not found or Docker not running',
      raw: output
    })
  }
  
  const isRunning = output.trim() === 'true'
  res.json({ 
    success: true, 
    status: isRunning ? 'running' : 'stopped',
    details: isRunning ? 'Service is active' : 'Service is stopped'
  })
})

app.post('/api/admin/docker/start', async (req, res) => {
  // First try to start existing container
  let result = await runDockerCommand(`docker start ${DOCKER_CONTAINER_NAME}`)
  
  if (result.success) {
    return res.json({ success: true, message: 'Container started' })
  }
  
  // If failed because it doesn't exist, try docker-compose up
  if (result.output && result.output.includes('No such container')) {
    console.log('Container not found, attempting docker-compose up...')
    const voiceServicePath = path.join(__dirname, '../ai-voice-service')
    
    // Check if another build/up is running might be good, but difficult.
    // We'll just try to run it.
    const composeResult = await runDockerCommand('docker-compose up -d', voiceServicePath)
    
    if (composeResult.success) {
      return res.json({ success: true, message: 'Container created and started via Docker Compose' })
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to start container (Compose failed)', 
        details: composeResult.output 
      })
    }
  }

  // Other error
  res.status(500).json({ success: false, error: 'Failed to start container', details: result.output })
})

app.post('/api/admin/docker/stop', async (req, res) => {
  const { success, output } = await runDockerCommand(`docker stop ${DOCKER_CONTAINER_NAME}`)
  res.json({ success, message: success ? 'Container stopped' : 'Failed to stop', details: output })
})

app.post('/api/admin/docker/restart', async (req, res) => {
  const { success, output } = await runDockerCommand(`docker restart ${DOCKER_CONTAINER_NAME}`)
  res.json({ success, message: success ? 'Container restarted' : 'Failed to restart', details: output })
})

// --- Endpoints ---

// Auth / User
app.get('/api/auth/me', (req, res) => {
  // Mock response for "Me" - defaulting to an Admin user to fix visibility issues
  res.json({
    success: true,
    data: {
      profile: {
        id: 'admin-user-id',
        email: 'admin@direitai.com',
        role: 'admin',
        is_admin: true, // Force admin flag
        plan: 'vip',
        full_name: 'Administrador Local',
        username: 'admin',
        created_at: new Date().toISOString()
      },
      session: {
        access_token: 'mock-token',
        user: { id: 'admin-user-id', email: 'admin@direitai.com' }
      }
    }
  })
})

app.get('/api/admin/users', (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const start = (page - 1) * limit
  const end = start + limit
  
  res.json({
    success: true,
    users: mockUsers.slice(start, end),
    total: mockUsers.length,
    page,
    totalPages: Math.ceil(mockUsers.length / limit)
  })
})

app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    data: mockNotifications,
    unread_count: mockNotifications.filter(n => !n.read).length
  })
})

app.get('/api/events', (req, res) => {
  res.json({
    success: true,
    data: mockEvents,
    meta: { total: mockEvents.length, page: 1, limit: 10 }
  })
})

app.get('/api/announcements', (req, res) => {
  res.json({
    success: true,
    data: []
  })
})

// --- Politicians Endpoints ---
app.get('/api/politicians', (req, res) => {
  res.json({
    success: true,
    data: mockPoliticians
  })
})

app.get('/api/politicians/:id', (req, res) => {
  const p = mockPoliticians.find(x => x.id === req.params.id)
  if (!p) return res.status(404).json({ success: false, error: 'Not found' })
  res.json({ success: true, data: p })
})

app.post('/api/politicians', (req, res) => {
  const newPol = {
    id: `pol-${Date.now()}`,
    ...req.body,
    status: req.body.status || 'pending',
    created_at: new Date().toISOString()
  }
  mockPoliticians.push(newPol)
  console.log('Politician created:', newPol.name)
  res.json({ success: true, data: newPol })
})

app.put('/api/politicians/:id', (req, res) => {
  const idx = mockPoliticians.findIndex(x => x.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' })
  
  mockPoliticians[idx] = { ...mockPoliticians[idx], ...req.body }
  console.log('Politician updated:', mockPoliticians[idx].name, 'Voice Config:', mockPoliticians[idx].voice_config)
  res.json({ success: true, data: mockPoliticians[idx] })
})

app.delete('/api/politicians/:id', (req, res) => {
  mockPoliticians = mockPoliticians.filter(x => x.id !== req.params.id)
  res.json({ success: true })
})

app.put('/api/admin/politicians/:id/expenses-visibility', (req, res) => {
  const idx = mockPoliticians.findIndex(x => x.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' })
  
  mockPoliticians[idx].expenses_visible = req.body.expenses_visible
  res.json({ success: true, data: mockPoliticians[idx] })
})

// AI Usage
app.get('/api/ai/usage', (req, res) => {
  res.json({
    success: true,
    data: {
      total_tokens: 15000,
      conversations: 42,
      cost: 0.15,
      limit: 100000
    }
  })
})

app.get('/api/ai/conversations', (req, res) => {
  res.json({
    success: true,
    data: [],
    meta: { total: 0 }
  })
})

// Financial / Stripe (Modified to handle missing key)
app.get('/api/payments/credits/transactions', requireStripe, async (req, res) => {
  try {
    if (!req.stripe) return res.json({ success: true, data: [] }) // Mock empty if no key
    
    const limit = Math.min(parseInt(req.query.limit || '50'), 100)
    const created = parseRange(req)
    const charges = await req.stripe.charges.list({ limit, created })
    const tx = (charges.data || []).map(c => ({
      id: c.id,
      amount: (c.amount || 0) / 100,
      createdAt: new Date((c.created || 0) * 1000).toISOString(),
      status: c.paid ? 'completed' : (c.status || 'pending'),
      method: (c.payment_method_details && c.payment_method_details.type) || 'card',
    }))
    res.json({ success: true, data: tx })
  } catch (e) {
    console.error('Stripe Error:', e)
    res.json({ success: true, data: [] }) // Fallback to empty on error
  }
})

app.get('/api/admin/financial/overview', requireStripe, async (req, res) => {
  try {
    if (!req.stripe) {
      // Return mock financial overview
      return res.json({ success: true, data: {
        totalRevenue: 12500.00,
        monthlyGrowth: 15.5,
        totalSubscriptions: 45,
        subscriptionGrowth: 5,
        averageOrderValue: 120.00,
        aovGrowth: 2.1,
        churnRate: 1.2,
        churnChange: -0.5,
      }})
    }

    const created = parseRange(req)
    const charges = await req.stripe.charges.list({ limit: 100, created })
    const list = charges.data || []
    const totalRevenue = list.reduce((s, c) => s + ((c.amount || 0) / 100), 0)
    const avg = list.length ? totalRevenue / list.length : 0
    res.json({ success: true, data: {
      totalRevenue,
      monthlyGrowth: 0,
      totalSubscriptions: 0,
      subscriptionGrowth: 0,
      averageOrderValue: avg,
      aovGrowth: 0,
      churnRate: 0,
      churnChange: 0,
    } })
  } catch (e) {
    console.error('Stripe Error:', e)
    res.json({ success: true, data: { totalRevenue: 0, averageOrderValue: 0 } })
  }
})

app.get('/api/admin/financial/transactions', requireStripe, async (req, res) => {
  try {
    if (!req.stripe) return res.json({ success: true, data: { transactions: [], total: 0, page: 1, totalPages: 1 } })

    const created = parseRange(req)
    const charges = await req.stripe.charges.list({ limit: 100, created })
    const list = (charges.data || []).map(c => ({
      id: c.id,
      type: 'product',
      customer: c.billing_details && c.billing_details.name || 'Cliente',
      plan: undefined,
      description: c.description || '',
      amount: (c.amount || 0) / 100,
      status: c.paid ? 'completed' : (c.status || 'pending'),
      date: new Date((c.created || 0) * 1000).toISOString(),
      method: 'credit_card'
    }))
    res.json({ success: true, data: { transactions: list, total: list.length, page: 1, totalPages: 1 } })
  } catch (e) {
    console.error('Stripe Error:', e)
    res.json({ success: true, data: { transactions: [], total: 0 } })
  }
})

app.get('/api/admin/financial/monthly-revenue', requireStripe, async (req, res) => {
  try {
    if (!req.stripe) {
      // Mock monthly data
      return res.json({ success: true, data: [
        { month: '2024-01', revenue: 5000, subscriptions: 10, orders: 20 },
        { month: '2024-02', revenue: 7500, subscriptions: 15, orders: 30 },
      ]})
    }

    const created = parseRange(req)
    const charges = await req.stripe.charges.list({ limit: 100, created })
    const buckets = {}
    for (const c of (charges.data || [])) {
      const d = new Date((c.created || 0) * 1000)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      buckets[key] = (buckets[key] || 0) + ((c.amount || 0) / 100)
    }
    const out = Object.entries(buckets).map(([month, revenue]) => ({ month, revenue, subscriptions: 0, orders: 0 }))
    res.json({ success: true, data: out })
  } catch (e) {
    console.error('Stripe Error:', e)
    res.json({ success: true, data: [] })
  }
})

app.get('/api/admin/financial/top-products', async (req, res) => {
  res.json({ success: true, data: [] })
})

app.get('/api/admin/store/orders', (req, res) => {
  res.json({ success: true, data: { orders: [], total: 0 } })
})

app.get('/api/admin/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: mockUsers.length,
      activeUsers: mockUsers.filter(u => u.status === 'active').length,
      totalEvents: mockEvents.length,
      revenue: 12500
    }
  })
})

// Catch-all for other API routes to prevent 500s
app.use('/api', (req, res) => {
  console.log(`[404] Route not found: ${req.url}`)
  res.status(404).json({ success: false, error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Stripe/Mock API server listening on http://localhost:${PORT}`)
})
