const fs = require('fs');

async function debugPost() {
  const token = "39f64dbe579b64da193073857abf6ae7"; // From user's config
  console.log("1. Autologin...");
  const params = new URLSearchParams({ wstoken: token, wsfunction: "tool_mobile_get_autologin_key", privatetoken: token, moodlewsrestformat: "json" });
  
  const autoLoginRes = await fetch("http://127.0.0.1:5173/api/webservice/rest/server.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  }).then(r => r.json());
  
  let cookies = [];
  const autoLoginReq = await fetch(autoLoginRes.autologinurl.replace("https://moodle.argeyazilim.tr", "http://127.0.0.1:5173/api"), { redirect: "manual" });
  if (autoLoginReq.headers.get("set-cookie")) {
    cookies = autoLoginReq.headers.get("set-cookie").split(',').map(c => c.split(';')[0]);
  }
  const cookieStr = cookies.join("; ");
  console.log("Cookies:", cookieStr);
  
  console.log("2. Fetch modedit...");
  const formUrl = "http://127.0.0.1:5173/api/course/modedit.php?add=url&type=&course=6371&section=0&return=0&sr=0";
  const getReq = await fetch(formUrl, { headers: { "Cookie": cookieStr } });
  const html = await getReq.text();
  
  const sesskeyMatch = html.match(/name="sesskey" value="([^"]+)"/);
  if(!sesskeyMatch) return console.log("No sesskey!");
  
  const fd = new FormData();
  // We'll mimic what ActivityFormModal does manually
  fd.append("sesskey", sesskeyMatch[1]);
  fd.append("course", "6371");
  fd.append("coursemodule", "");
  fd.append("section", "0");
  fd.append("module", "20");
  fd.append("modulename", "url");
  fd.append("instance", "");
  fd.append("add", "url");
  fd.append("update", "0");
  fd.append("return", "0");
  fd.append("sr", "0");

  fd.append("name", "Test URL via JS");
  fd.append("externalurl", "https://google.com");
  fd.append("introeditor[text]", "Hello world");
  fd.append("introeditor[format]", "1");
  fd.append("submitbutton", "Kaydet ve derse dön");

  console.log("3. Post modedit...");
  const postReq = await fetch("http://127.0.0.1:5173/api/course/modedit.php", {
    method: "POST",
    headers: { "Cookie": cookieStr },
    body: fd,
    redirect: "manual"
  });

  console.log("Status:", postReq.status);
  const location = postReq.headers.get("location");
  console.log("Location:", location);
  
  if (postReq.status === 200) {
    const postHtml = await postReq.text();
    fs.writeFileSync("post_debug.html", postHtml);
    console.log("Saved 200 HTML to post_debug.html");
  }
}
debugPost().catch(console.error);
