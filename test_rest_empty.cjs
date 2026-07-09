const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5173,
  path: '/api/webservice/rest/server.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': 0
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let body = Buffer.alloc(0);
  res.on('data', chunk => body = Buffer.concat([body, chunk]));
  res.on('end', () => console.log('Body length:', body.length));
});

req.on('error', e => console.error('Error:', e));
req.end();
