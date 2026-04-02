import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { initDB } from './db/index.js';
import meetingsRouter from './routes/meetings.js';
import agendaItemsRouter from './routes/agendaItems.js';
import bylawsRouter from './routes/bylaws.js';
import resolutionsRouter from './routes/resolutions.js';
import delegationsRouter from './routes/delegations.js';
import searchRouter from './routes/search.js';
import attachmentsRouter from './routes/attachments.js';

const app = express();
const PORT = 3001;

// Init database
initDB();
console.log('Database initialized');

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', meetingsRouter);
app.use('/api', agendaItemsRouter);
app.use('/api', bylawsRouter);
app.use('/api', resolutionsRouter);
app.use('/api', delegationsRouter);
app.use('/api', searchRouter);
app.use('/api', attachmentsRouter);

app.listen(PORT, () => {
  console.log(`AgendaFlow API running on http://localhost:${PORT}`);
});
