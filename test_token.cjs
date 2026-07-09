async function run() {
  const token = "39f64dbe579b64da193073857abf6ae7";
  const params = new URLSearchParams({ wstoken: token, wsfunction: "tool_mobile_get_autologin_key", privatetoken: token, moodlewsrestformat: "json" });
  
  const res = await fetch("https://moodle.argeyazilim.tr/webservice/rest/server.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  console.log(await res.text());
}
run();
