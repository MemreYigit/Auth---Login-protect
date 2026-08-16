import express, {type Express, type Request, type Response} from 'express';
import * as repository from './repository';

const app: Express = express();
const port = 3000;

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');

app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Get all tasks extended with done status, search query and offset/limit pagination
app.get('/tasks', async (req: Request, res: Response) => {
  const { done, search, offset, limit } = req.query;

  const filters: repository.TaskFilters = {};

  if (done !== undefined) {
    if (done !== 'true' && done !== 'false') {
      return res.status(400).json({ error: 'Invalid done query parameter' });
    }
    filters.done = done === 'true';
  }

  if (search !== undefined) {
    const word = String(search).trim();
    if (word === '') {
      return res.status(400).json({ error: 'Search must not be empty' });
    }
    filters.search = word;
  }

  if (limit !== undefined) {
    if (typeof limit !== 'string' || limit.trim() === '') {
      return res.status(400).json({ error: 'Invalid limit query parameter' });
    }
    const limitNum = Number(limit);
    if (!Number.isFinite(limitNum) || limitNum < 0) {
      return res.status(400).json({ error: 'Invalid limit query parameter' });
    }
    filters.limit = limitNum;
  }

  if (offset !== undefined) {
    if (typeof offset !== 'string' || offset.trim() === '') {
      return res.status(400).json({ error: 'Invalid offset query parameter' });
    }
    const offsetNum = Number(offset);
    if (!Number.isFinite(offsetNum) || offsetNum < 0) {
      return res.status(400).json({ error: 'Invalid offset query parameter' });
    }
    filters.offset = offsetNum;
  }

  const tasks = await repository.listTasks(filters);
  return res.json(tasks);
});

// Get task
app.get('/tasks/:id', async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  const task = await repository.getTaskById(taskId);

  if (!task) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  return res.json(task);
});

// Create task
app.post('/tasks', async (req: Request, res: Response) => {
  const title = req.body?.title;
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and cannot be empty' });
  }

  const task = await repository.createTask(title.trim());

  return res.status(201).json({ message: 'Task created successfully', task });
});

// Update task
app.put('/tasks/:id', async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  const row = await repository.getTaskById(taskId);

  if (!row) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  const { title, done } = req.body ?? {};
  const hasTitle = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'title');
  const hasDone = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'done');

  if (!hasTitle && !hasDone) {
    return res.status(400).json({ error: 'Request body must include title and/or done' });
  }

  let nextTitle = row.title;
  let nextDone = row.done;

  if (hasTitle) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }
    nextTitle = title.trim();
  }

  if (hasDone) {
    if (typeof done !== 'boolean') {
      return res.status(400).json({ error: 'Done must be a boolean' });
    }
    nextDone = done;
  }

  const updated = await repository.updateTask(taskId, { title: nextTitle, done: nextDone });
  res.json(updated);
});

// Delete task
app.delete('/tasks/:id', async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  const deleted = await repository.deleteTask(taskId);

  if (!deleted) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  res.status(204).send();
});

app.get('/stats', async (req: Request, res: Response) => {
  const stats = await repository.getStats();
  return res.json(stats);
});

app.post('/reset', async (req: Request, res: Response) => {
  const tasks = await repository.resetTasks();
  return res.json({ message: 'Tasks reset successfully', tasks });
});

app.get('/', (req: Request, res: Response) => {
  return res.json({ name: 'Task API', version: '1.0', endpoints: ["/tasks"] });
});

app.get('/health', (req: Request, res: Response) => {
  return res.json({ status: 'OK' });
});

repository.init()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  })
  .catch((err: unknown) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
