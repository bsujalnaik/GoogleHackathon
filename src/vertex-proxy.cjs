const express = require('express');
const cors = require('cors');
const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const { SmartAPI } = require('smartapi-javascript');
const { authenticator } = require('otplib');

const app = express();
app.use(cors());
app.use(express.json());

// Robustly load your service account key JSON file
const serviceAccountPath = path.join(__dirname, 'fi-mcp-574330cdd017.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account file not found at:', serviceAccountPath);
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);
console.log('Loaded service account:', serviceAccount.client_email);

// Vertex AI chat proxy
app.post('/vertex-chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    console.log('Access token:', accessToken);

    const url = 'https://generativelanguage.googleapis.com/v1beta3/models/chat-bison-001:generateMessage';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token || accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: { messages: [{ content: prompt }] },
        temperature: 0.2,
        candidateCount: 1,
      }),
    });
    const data = await response.json();
    if (data.error) {
      console.error('Vertex AI API error:', data.error);
    }
    res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message || err.toString() });
  }
});

// SmartAPI credentials (replace with your real values)
const API_KEY = 'GljUpZfh';
const CLIENT_CODE = 'PUTUA55715'; // <-- Replace with your Angel One client code
const PASSWORD = '3002'; // <-- Replace with your Angel One password
const TOTP_SECRET = 'MNFD5TJO5ANGZ362MLVJHSMTAE'; // Your TOTP secret
let accessToken = null;

// Helper: Login and get access token (programmatically)
async function loginAndGetToken() {
  const smartApi = new SmartAPI({ api_key: API_KEY });
  const totp = authenticator.generate(TOTP_SECRET);
  try {
    const session = await smartApi.generateSession(CLIENT_CODE, PASSWORD, totp);
    accessToken = session.data.refreshToken;
    console.log('SmartAPI session token:', accessToken);
  } catch (err) {
    console.error('SmartAPI login error:', err);
    throw err;
  }
}

// Holdings endpoint
app.get('/api/holdings', async (req, res) => {
  try {
    if (!accessToken) {
      await loginAndGetToken();
    }
    const smartApi = new SmartAPI({
      api_key: API_KEY,
      access_token: accessToken,
    });
    const holdings = await smartApi.getHoldings();
    res.json(holdings.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Placeholder: Real Tax Opportunities API
app.get('/api/tax-opportunities', async (req, res) => {
  // TODO: Analyze real transactions/holdings for tax opportunities here
  // Example: const opportunities = await analyzeTaxOpportunities(req.user);
  const opportunities = [
    {
      id: 1,
      type: "LTCG Harvesting",
      stock: "RELIANCE",
      potential: 25000,
      deadline: "15 days",
      risk: "low",
      description: "Harvest long-term capital gains to offset future liabilities"
    },
    {
      id: 2,
      type: "Tax Loss Harvesting",
      stock: "TATASTEEL",
      potential: 18000,
      deadline: "7 days",
      risk: "medium",
      description: "Book losses to reduce taxable income for FY 2024-25"
    },
    {
      id: 3,
      type: "STCG Optimization",
      stock: "INFY",
      potential: 12000,
      deadline: "30 days",
      risk: "low",
      description: "Optimize short-term gains timing for better tax efficiency"
    }
  ];
  res.json(opportunities);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Vertex AI proxy listening on port ${PORT}`));
