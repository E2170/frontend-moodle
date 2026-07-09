async function testApi() {
  const token = "39f64dbe579b64da193073857abf6ae7";
  
  const params = new URLSearchParams({
    wstoken: token,
    wsfunction: "local_vueapi_add_activity",
    moodlewsrestformat: "json",
    courseid: "6371",
    section: "0",
    type: "assign",
    name: "Vue API Test Odev 2",
    description: "Bu bir API testidir",
    duedate: "1688888888",
    externalurl: "https://google.com"
  });

  const res = await fetch("https://moodle.argeyazilim.tr/webservice/rest/server.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}
testApi().catch(console.error);
