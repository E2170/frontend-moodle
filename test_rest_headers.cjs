const http = require('http');

const data = 'wstoken=ac8d229c4e406ba9252a88a1b9f01fb8&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json';

const options = {
  hostname: '127.0.0.1',
  port: 5173,
  path: '/api/webservice/rest/server.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(data),
    'Accept-Encoding': 'gzip, deflate, br',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let body = Buffer.alloc(0);
  res.on('data', chunk => body = Buffer.concat([body, chunk]));
  res.on('end', () => console.log('Body length:', body.length));
});

req.on('error', e => console.error('Error:', e));
req.write(data);
req.end();
