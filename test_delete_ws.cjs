const http = require('http');

function test(wsfunction, extra) {
  return new Promise((resolve) => {
    const data = `wstoken=ac8d229c4e406ba9252a88a1b9f01fb8&wsfunction=${wsfunction}&moodlewsrestformat=json&${extra}`;
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
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`[${wsfunction}]`, body);
        resolve();
      });
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  await test('core_course_delete_modules', 'cmids[0]=99999');
  await test('core_webservice_get_site_info', '');
}
run();
