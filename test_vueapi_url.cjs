const http = require('http');

async function testApi() {
  const token = "39f64dbe579b64da193073857abf6ae7"; // The token from earlier
  
  const params = new URLSearchParams({
    wstoken: token,
    wsfunction: "local_vueapi_add_activity",
    moodlewsrestformat: "json",
    courseid: "6371",
    section: "0",
    type: "url",
    name: "Test Vue API URL",
    description: "Testing if URL works",
    externalurl: "https://google.com"
  });

  const res = await fetch("https://moodle.argeyazilim.tr/webservice/rest/server.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  const text = await res.text();
  console.log("Response:", text);
}
testApi().catch(console.error);
