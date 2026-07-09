const http = require('http');

const token = 'ac8d229c4e406ba9252a88a1b9f01fb8';
const userid = 2152;

const requests = [
  `wstoken=${token}&wsfunction=core_enrol_get_users_courses&userid=${userid}&moodlewsrestformat=json`,
  `wstoken=${token}&wsfunction=core_calendar_get_action_events_by_timesort&moodlewsrestformat=json`,
  `wstoken=${token}&wsfunction=mod_forum_get_forum_discussions&forumid=2&moodlewsrestformat=json`,
  `wstoken=${token}&wsfunction=core_message_get_conversations&userid=${userid}&moodlewsrestformat=json`
];

requests.forEach((data, index) => {
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
    res.on('end', () => console.log(`Request ${index} Status:`, res.statusCode, 'Body length:', body.length));
  });

  req.on('error', e => console.error(`Request ${index} Error:`, e));
  req.write(data);
  req.end();
});
