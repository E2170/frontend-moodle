const http = require('http');

const data = 'wstoken=ac8d229c4e406ba9252a88a1b9f01fb8&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json';

const options = {
  hostname: '127.0.0.1',
  port: 5173,
  path: '/api/webservice/rest/server.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Body:', body.substring(0, 500)));
});

req.on('error', e => console.error('Error:', e));
req.write(data);
req.end();
