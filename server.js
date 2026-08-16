import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './openapi.json' with { type: 'json' };
import { supabase } from './supabaseClient.js';
import { requireAuth } from './authMiddleware.js';

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

// Protected endpoint profile
app.get('/protected/profile', requireAuth, (req, res) => {
  const { user } = req;
  return res.status(200).json({ id: user.id, email: user.email, "account-created date": user.created_at });
});

// Protected endpoint logout
app.post('/auth/logout', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected endpoint dashboard
app.get('/protected/dashboard', requireAuth, async (req, res) => {
  const { user } = req;
  return res.status(200).json({ message: `Welcome to your dashboard, ${user.email}!` });
});

app.get('/health', async (req, res) => {
  return res.json({ status: 'OK' });
});

app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
});