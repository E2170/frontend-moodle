async function checkWsFunction() {
  const token = "39f64dbe579b64da193073857abf6ae7"; // The token from earlier
  
  const params = new URLSearchParams({
    wstoken: token,
    wsfunction: "local_vueapi_add_activity",
    moodlewsrestformat: "json",
    courseid: "6371",
    section: "0",
    type: "assign",
    name: "Test Vue API",
    description: "Testing if this function exists"
  });

  const res = await fetch("https://moodle.argeyazilim.tr/webservice/rest/server.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  const text = await res.text();
  console.log("Response:", text);
}
checkWsFunction().catch(console.error);
