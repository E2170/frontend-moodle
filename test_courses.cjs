const http = require('http');

const token = 'ac8d229c4e406ba9252a88a1b9f01fb8';
const userid = 2152;
const data = `wstoken=${token}&wsfunction=core_enrol_get_users_courses&userid=${userid}&moodlewsrestformat=json`;

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
  let body = Buffer.alloc(0);
  res.on('data', chunk => body = Buffer.concat([body, chunk]));
  res.on('end', () => console.log('Courses:', body.toString()));
});

req.on('error', e => console.error('Error:', e));
req.write(data);
req.end();
