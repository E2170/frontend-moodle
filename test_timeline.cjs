const http = require('http');

const token = 'ac8d229c4e406ba9252a88a1b9f01fb8';
const data = `wstoken=${token}&wsfunction=core_calendar_get_action_events_by_timesort&moodlewsrestformat=json`;

const options = {
  hostname: '127.0.0.1',
  port: 5173,
  path: '/api/webservice/rest/server.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(data),
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let body = Buffer.alloc(0);
  res.on('data', chunk => body = Buffer.concat([body, chunk]));
  res.on('end', () => console.log('Body:', body.toString().substring(0, 500)));
});

req.on('error', e => console.error('Error:', e));
req.write(data);
req.end();
