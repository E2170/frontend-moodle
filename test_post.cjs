const http = require('http');

const data = 'username=ahmetertugrul&password=Hoca123%21&service=moodle_mobile_app';

const options = {
  hostname: '127.0.0.1',
  port: 5173,
  path: '/api/login/token.php',
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
  res.on('end', () => console.log('Body:', body));
});

req.on('error', e => console.error('Error:', e));
req.write(data);
req.end();
