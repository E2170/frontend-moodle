const https = require('https');

async function test() {
  const username = "canerbalim";
  const password = "User123!";
  
  const tokenUrl = `https://moodle.argeyazilim.tr/login/token.php?username=${username}&password=${password}&service=moodle_mobile_app`;
  
  const tokenRes = await fetch(tokenUrl);
  const tokenData = await tokenRes.json();
  console.log('Token Data:', tokenData);
  
  if (tokenData.token && tokenData.privatetoken) {
    const wsUrl = 'https://moodle.argeyazilim.tr/webservice/rest/server.php';
    const body = `wstoken=${tokenData.token}&wsfunction=tool_mobile_get_autologin_key&privatetoken=${tokenData.privatetoken}&moodlewsrestformat=json`;
    
    const wsRes = await fetch(wsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    
    const wsData = await wsRes.json();
    console.log('WS Data:', wsData);
  }
}

test();
