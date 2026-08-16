import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './openapi.json' with { type: 'json' };
import { supabase } from './supabaseClient.js';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Signup Route
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    // Handle errors from Supabase
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Return success response
    return res.status(201).json({ message: 'User created successfully', user: data.user });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login Route
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    // Handle errors from Supabase
    if (error) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    // Return access and refresh tokens
    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Public endpoint
app.get('/public/info', async (req, res) => {
  return res.status(200).json({ "message": "Welcome stranger! This info is public." })
});

// Protected endpoint
app.get('/protected/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    return res.status(200).json({ id: user.id, email: user.email, "account-created date": user.created_at });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', async (req, res) => {
  return res.json({ status: 'OK' });
});

app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
});