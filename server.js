import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './openapi.json' with { type: 'json' };
import { supabase } from './supabaseClient.js';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(201).json({ message: 'User created successfully', user: data.user });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => {
  return res.json({ status: 'OK' });
});

app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
});