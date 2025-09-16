import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import morgan from 'morgan';
import methodOverride from 'method-override';
import adminRoutes from './routes/admin.js';
import devicesRoutes from './routes/devices.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(morgan('dev'));
app.use(express.static(path.join(process.cwd(), 'public')));

// Simple auth check (?pass=ADMIN_PASS)
app.use((req, res, next) => {
  res.locals.isAuthed = (req.query.pass && req.query.pass === process.env.ADMIN_PASS) || false;
  next();
});

app.use('/admin', adminRoutes);
app.use('/devices', devicesRoutes);

app.get('/', (req, res) => res.redirect('/admin'));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
