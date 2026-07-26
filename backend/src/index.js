import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import eventsRouter from './routes/events.js';
import expensesRouter from './routes/expenses.js';
import balancesRouter from './routes/balances.js';

const app = express();
app.use(cors());
app.use(express.json());

// Route de santé — utile pour vérifier que le serveur tourne sur Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/events', eventsRouter);
app.use('/api/events/:eventId/expenses', expensesRouter);
app.use('/api/events/:eventId/balances', balancesRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Festorga backend démarré sur le port ${port}`);
});
