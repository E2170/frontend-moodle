const http = require('http');

const data = 'username=ahmetertugrul&password=Hoca123%21&service=moodle_mobile_app';

const options = {
  hostname: '127.0.0.1',
  port: 5173,
  path: '/api/login/token.php',
  method: 'POST',
  headers: {
    'Host': 'localhost:5173',
    'Connection': 'keep-alive',
    'sec-ch-ua': '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
    'sec-ch-ua-mobile': '?0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': '*/*',
    'Origin': 'http://localhost:5173',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'http://localhost:5173/',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
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
