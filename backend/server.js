const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const resumeRoutes = require('./routes/resumes');
const taskRoutes = require('./routes/tasks');
const profileRoutes = require('./routes/profile');
const ticketRoutes = require('./routes/tickets');
const attendanceRoutes = require('./routes/attendance');

dotenv.config();
const app = express();

// Configure CORS to allow requests from the frontend
app.use(cors({
    origin: '*', // Allow all origins for development; restrict in production (e.g., 'http://your-frontend-url')
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Enable if you need to send cookies or auth headers
}));

// Parse JSON bodies
app.use(express.json());

// Log all incoming requests for debugging
app.use((req, res, next) => {
   // console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Handle 404 errors for undefined routes
app.use((req, res) => {
   // console.warn(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Route not found' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
   // console.error(`[${new Date().toISOString()}] Error:`, err.message, err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));