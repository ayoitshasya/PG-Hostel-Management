// This is the entry point of the backend server. Running `node index.js`
// (or `npm run dev`/`npm start`) starts this file, which:
//   1. Loads environment variables from .env
//   2. Creates an Express app and wires up middleware + routes
//   3. Connects to MongoDB, and only starts listening for requests once
//      that connection succeeds (so we never serve traffic without a DB)

// Loads variables from a local .env file (MONGODB_URI, JWT_SECRET, etc.)
// into process.env. Must run before anything below reads process.env.
require('dotenv').config();
// Wraps every route handler so that a thrown error (or rejected promise)
// inside an `async` route automatically gets passed to Express's error
// handler below, instead of crashing the server or hanging the request.
require('express-async-errors');
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const inquiryRoutes = require('./routes/inquiries');
const uploadRoutes = require('./routes/uploads');
const metaRoutes = require('./routes/meta');

const app = express();

// CORS = Cross-Origin Resource Sharing. By default browsers block a
// frontend running on one origin (e.g. http://localhost:5173) from calling
// an API on a different origin (e.g. http://localhost:5000). This tells
// the browser "requests from CLIENT_ORIGIN are allowed to call this API,
// using these HTTP methods and headers."
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Parses incoming requests with a JSON body (e.g. { "title": "..." }) into
// req.body, so route handlers can just read req.body.title directly.
app.use(express.json());

// API routes
// Each of these "mounts" a router at a URL prefix - e.g. any request to
// /api/auth/* is handed off to authRoutes to handle.
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/meta', metaRoutes);

// Simple health-check route - hitting the bare API URL confirms the
// server is up and responding, without touching the database.
app.get('/', (req, res) => res.json({ ok: true }));

// global error handler
// Express recognizes this as an error handler specifically because it
// takes 4 arguments (err, req, res, next). Any error passed to next(err),
// or thrown inside an async route (caught by express-async-errors above),
// ends up here instead of crashing the process.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pg_hostel';

// Connect to MongoDB first, and only start the HTTP server (app.listen)
// once that connection resolves. If the DB connection fails, we log it
// and exit instead of running a server that can never actually save/read
// data.
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(PORT, () => console.log(`Server running on ${PORT}`)))
  .catch(err => {
    console.error('DB connection failed', err);
    process.exit(1);
  });
