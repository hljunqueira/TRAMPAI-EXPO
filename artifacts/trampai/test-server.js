const http = require('http');
const PORT = parseInt(process.env.PORT || '8000');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('packager-status:running');
});

// Bind without specifying host — Node.js defaults to '::' (IPv6 dual-stack)
server.listen(PORT, () => {
  const addr = server.address();
  console.log(`[test-server] Listening on ${JSON.stringify(addr)}`);
});
