require('dotenv').config();
require('express-async-errors');
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const inquiryRoutes = require('./routes/inquiries');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/inquiries', inquiryRoutes);

app.get('/', (req, res) => res.json({ ok: true }));

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pg_hostel';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(PORT, () => console.log(`Server running on ${PORT}`)))
  .catch(err => {
    console.error('DB connection failed', err);
    process.exit(1);
  });
