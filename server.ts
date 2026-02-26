import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory OTP store (for demo purposes)
// In production, use Redis or a database
const otpStore = new Map<string, { otp: string; expires: number }>();

// 1. Request OTP
app.post('/api/auth/otp/request', (req, res) => {
  const { email } = req.body;
  
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(email, { otp, expires });

  // Simulate sending email
  console.log(`[AUTH] OTP for ${email}: ${otp}`);

  // In a real app, you would integrate SendGrid/AWS SES here
  // For this demo, we return the OTP in the response so the user can login
  res.json({ 
    success: true, 
    message: 'OTP sent to email',
    debug_otp: otp // Exposed for demo convenience
  });
});

// 2. Verify OTP
app.post('/api/auth/otp/verify', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ error: 'No OTP request found for this email' });
  }

  if (Date.now() > record.expires) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP has expired' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  // Success - Clear OTP
  otpStore.delete(email);

  // Return user data
  res.json({
    success: true,
    user: {
      name: email.split('@')[0], // Simple name derivation
      email: email,
      role: 'Auditor',
      company: 'Guardify User'
    }
  });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
