import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import certificateRoutes from './routes/certificates.js';
import templateRoutes from './routes/templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for generated certificates
app.use('/certificates', express.static(path.join(__dirname, 'generated')));

// Static Frontend Hosting
const frontendDistPath = path.join(__dirname, '..', 'dist');
app.use(express.static(frontendDistPath));

// Routes
app.use('/api/certificates', certificateRoutes);
app.use('/api/templates', templateRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Certificate Generator API is running',
        timestamp: new Date().toISOString()
    });
});

// This catch-all route should be placed AFTER all API routes
// It sends the 'index.html' file for any request that doesn't match an API endpoint,
// enabling client-side routing in React.
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Certificate Generator API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📝 API Docs: http://localhost:${PORT}/api/certificates (POST)`);
});

export default app; 