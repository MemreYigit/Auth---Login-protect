import express, {type Express, type Request, type Response} from 'express';
import { supabase } from './supabaseClient';

const app: Express = express();
const port = Number(process.env.PORT) || 3000;

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');

app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req: Request, res: Response) => {
  return res.json({ status: 'OK' });
});

app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
});