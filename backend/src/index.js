import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import eventsRouter from './routes/events.js';
import expensesRouter from './routes/expenses.js';
import balancesRouter from './routes/balances.js';
import settlementsRouter from './routes/settlements.js';
import checklistRouter from './routes/checklist.js';

const app = express();

// En dev, FRONTEND_URL n'est pas défini : on autorise tout pour ne pas se
// battre avec CORS en local. En prod, on restreint à l'URL du frontend Render.
app.use(cors(process.env.FRONTEND_URL ? { origin: process.env.FRONTEND_URL } : {}));
app.use(express.json());

// Route de santé — utile pour vérifier que le serveur tourne sur Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/events', eventsRouter);
app.use('/api/events/:eventId/expenses', expensesRouter);
app.use('/api/events/:eventId/balances', balancesRouter);
app.use('/api/events/:eventId/settlements', settlementsRouter);
app.use('/api/events/:eventId/checklist', checklistRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Festorga backend démarré sur le port ${port}`);
});
