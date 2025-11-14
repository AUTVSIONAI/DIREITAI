const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const Stripe = require('stripe')

const PORT = process.env.API_PORT || 5120
const app = express()
app.use(cors({ origin: true }))
app.use(bodyParser.json())

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
  if (!stripe) return res.status(401).json({ success: false, error: 'STRIPE_SECRET_KEY missing' })
  req.stripe = stripe
  next()
}

app.get('/api/payments/credits/transactions', requireStripe, async (req, res) => {
  try {
    const stripe = req.stripe
    const limit = Math.min(parseInt(req.query.limit || '50'), 100)
    const created = parseRange(req)
    const charges = await stripe.charges.list({ limit, created })
    const tx = (charges.data || []).map(c => ({
      id: c.id,
      amount: (c.amount || 0) / 100,
      createdAt: new Date((c.created || 0) * 1000).toISOString(),
      status: c.paid ? 'completed' : (c.status || 'pending'),
      method: (c.payment_method_details && c.payment_method_details.type) || 'card',
    }))
    res.json({ success: true, data: tx })
  } catch (e) {
    res.status(500).json({ success: false, error: String(e.message || e) })
  }
})

app.get('/api/admin/financial/overview', requireStripe, async (req, res) => {
  try {
    const stripe = req.stripe
    const created = parseRange(req)
    const charges = await stripe.charges.list({ limit: 100, created })
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
    res.status(500).json({ success: false, error: String(e.message || e) })
  }
})

app.get('/api/admin/financial/transactions', requireStripe, async (req, res) => {
  try {
    const stripe = req.stripe
    const created = parseRange(req)
    const charges = await stripe.charges.list({ limit: 100, created })
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
    res.status(500).json({ success: false, error: String(e.message || e) })
  }
})

app.get('/api/admin/financial/monthly-revenue', requireStripe, async (req, res) => {
  try {
    const stripe = req.stripe
    const created = parseRange(req)
    const charges = await stripe.charges.list({ limit: 100, created })
    const buckets = {}
    for (const c of (charges.data || [])) {
      const d = new Date((c.created || 0) * 1000)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      buckets[key] = (buckets[key] || 0) + ((c.amount || 0) / 100)
    }
    const out = Object.entries(buckets).map(([month, revenue]) => ({ month, revenue, subscriptions: 0, orders: 0 }))
    res.json({ success: true, data: out })
  } catch (e) {
    res.status(500).json({ success: false, error: String(e.message || e) })
  }
})

app.get('/api/admin/financial/top-products', async (req, res) => {
  res.json({ success: true, data: [] })
})

app.listen(PORT, () => {
  console.log(`Stripe API server listening on http://localhost:${PORT}`)
})
