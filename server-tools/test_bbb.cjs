const https = require('https');
const token = '1d960f58d92cb64f02ea2eeeb4c5029d'; // need a real token or I can just check if the function is recognized
const url = 'https://moodle.argeyazilim.tr/webservice/rest/server.php?wstoken=' + token + '&wsfunction=mod_bigbluebuttonbn_get_join_url&moodlewsrestformat=json&cmid=1';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
