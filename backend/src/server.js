import express from 'express';
import { MongoClient } from 'mongodb';
import { validateTask } from './tasks.js';
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://mongodb:27017/orbit', { serverSelectionTimeoutMS: 5000 });
await client.connect();
const db = client.db();
// A single board document allows atomic backup replacement without requiring a replica set.
const boards = db.collection('boards');
await boards.updateOne({ _id: 'personal' }, { $setOnInsert: { tasks: [] } }, { upsert: true });
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8mb' }));
const list = async () => (await boards.findOne({ _id: 'personal' })).tasks;
const validate = (data, options) => { try { return validateTask(data, options); } catch (error) { error.status = 400; throw error; } };
app.get('/api/health', async (req, res) => { await db.command({ ping: 1 }); res.json({ status: 'ok' }); });
app.get('/api/tasks', async (req, res) => res.json(await list()));
app.post('/api/tasks', async (req, res) => {
  const task = validate(req.body);
  const result = await boards.updateOne({ _id: 'personal', 'tasks.9999': { $exists: false } }, { $push: { tasks: task } });
  if (!result.matchedCount) return res.status(409).json({ error: 'Board limit of 10,000 tasks reached' });
  res.status(201).json(task);
});
app.post('/api/tasks/import', async (req, res) => {
  if (!Array.isArray(req.body?.tasks) || req.body.tasks.length > 10000 || typeof req.body.replace !== 'boolean') return res.status(400).json({ error: 'Invalid backup' });
  const tasks = req.body.tasks.map(task => validate(task, { imported: true }));
  if (new Set(tasks.map(task => task.id)).size !== tasks.length) return res.status(400).json({ error: 'Duplicate task ids' });
  if (req.body.replace) await boards.updateOne({ _id: 'personal' }, { $set: { tasks } });
  else {
    // Append only new ids and enforce capacity atomically, including concurrent requests.
    const additions = { $filter: { input: { $literal: tasks }, as: 'task', cond: { $not: [{ $in: ['$$task.id', '$tasks.id'] }] } } };
    const result = await boards.updateOne({ _id: 'personal', $expr: { $lte: [{ $add: [{ $size: '$tasks' }, { $size: additions }] }, 10000] } }, [{ $set: { tasks: { $concatArrays: ['$tasks', additions] } } }]);
    if (!result.matchedCount) return res.status(409).json({ error: 'Board limit of 10,000 tasks reached' });
  }
  res.json(await list());
});
app.patch('/api/tasks/:id', async (req, res) => {
  const data = validate(req.body, { partial: true });
  if (!Object.keys(data).length) return res.status(400).json({ error: 'No task fields supplied' });
  const board = await boards.findOneAndUpdate({ _id: 'personal', 'tasks.id': req.params.id }, { $set: Object.fromEntries(Object.entries(data).map(([key,value]) => [`tasks.$.${key}`, value])) }, { returnDocument: 'after' });
  if (!board) return res.status(404).json({ error: 'Task not found' });
  res.json(board.tasks.find(task => task.id === req.params.id));
});
app.delete('/api/tasks/:id', async (req, res) => {
  const result = await boards.updateOne({ _id: 'personal', 'tasks.id': req.params.id }, { $pull: { tasks: { id: req.params.id } } });
  if (!result.matchedCount) return res.status(404).json({ error: 'Task not found' });
  res.sendStatus(204);
});
app.use((req,res) => res.status(404).json({ error: 'Not found' }));
app.use((error, req, res, next) => {
  const status = error.status || 503;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'Database unavailable. Please try again.' : status === 413 ? 'Backup exceeds 8 MB' : error.message });
});
const server = app.listen(3000, '0.0.0.0', () => console.log('Orbit API listening on port 3000'));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close(async () => { await client.close(); process.exit(0); }));
