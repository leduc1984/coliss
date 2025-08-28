const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

class MTPServer {
  constructor() {
    this.app = express();
    this.port = 3001;
    this.automationProcess = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  setupRoutes() {
    // Start Playwright automation
    this.app.post('/api/start-automation', (req, res) => {
      try {
        this.startAutomation();
        res.json({ success: true, message: 'Automation started' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Stop Playwright automation
    this.app.post('/api/stop-automation', (req, res) => {
      try {
        this.stopAutomation();
        res.json({ success: true, message: 'Automation stopped' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        automationRunning: !!this.automationProcess,
        timestamp: new Date().toISOString()
      });
    });

    // Serve the main page
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'mtp-index.html'));
    });
  }

  startAutomation() {
    if (this.automationProcess) {
      throw new Error('Automation is already running');
    }

    console.log('Starting Playwright automation...');
    
    // Start the Playwright script as a child process
    this.automationProcess = spawn('node', ['playwright-script.js'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.automationProcess.stdout.on('data', (data) => {
      console.log(`Playwright stdout: ${data}`);
    });

    this.automationProcess.stderr.on('data', (data) => {
      console.error(`Playwright stderr: ${data}`);
    });

    this.automationProcess.on('close', (code) => {
      console.log(`Playwright process exited with code ${code}`);
      this.automationProcess = null;
    });
  }

  stopAutomation() {
    if (!this.automationProcess) {
      throw new Error('Automation is not running');
    }

    console.log('Stopping Playwright automation...');
    this.automationProcess.kill('SIGTERM');
    this.automationProcess = null;
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`MTP Server running at http://localhost:${this.port}`);
    });
  }
}

// Create and start the server
const server = new MTPServer();
server.start();

module.exports = MTPServer;