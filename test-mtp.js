const MTPServer = require('./mtp-server');

// Create and start the MTP server
const server = new MTPServer();

// Override the start method to avoid conflicts with the main server
server.start = function() {
  this.app.listen(this.port, () => {
    console.log(`MTP Test Server running at http://localhost:${this.port}`);
  });
};

server.start();

console.log('MTP Server test started. Visit http://localhost:3001 to test.');