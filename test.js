const http = require('http');

http.get('http://localhost:5173/api/login/token.php?username=test&password=test&service=moodle_mobile_app', (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Body:', data));
}).on('error', err => console.log('Error:', err.message));
