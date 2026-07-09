const fs = require('fs');

async function testPost() {
  const token = "39f64dbe579b64da193073857abf6ae7";
  
  // 1. Get autologin
  const params = new URLSearchParams({ wstoken: token, wsfunction: "tool_mobile_get_autologin_key", privatetoken: token, moodlewsrestformat: "json" });
  const autoLoginRes = await fetch("https://moodle.argeyazilim.tr/webservice/rest/server.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  }).then(r => r.json());
  
  // 2. Get cookie
  let cookies = [];
  const autoLoginReq = await fetch(autoLoginRes.autologinurl, { redirect: "manual" });
  if (autoLoginReq.headers.get("set-cookie")) {
    cookies = autoLoginReq.headers.get("set-cookie").split(',').map(c => c.split(';')[0]);
  }
  const cookieStr = cookies.join("; ");
  
  // 3. GET modedit
  const formUrl = "https://moodle.argeyazilim.tr/course/modedit.php?add=url&type=&course=6371&section=0&return=0&sr=0";
  const getReq = await fetch(formUrl, { headers: { "Cookie": cookieStr } });
  const html = await getReq.text();
  
  // parse hidden inputs
  const coreKeys = ['sesskey', 'course', 'coursemodule', 'section', 'module', 'modulename', 'instance', 'add', 'update', 'return', 'sr'];
  const fd = new FormData();
  
  // Simple regex to extract hidden inputs
  for (const key of coreKeys) {
    const regex = new RegExp(`name="${key}"\\s+value="([^"]*)"`);
    const match = html.match(regex);
    if (match) {
      fd.append(key, match[1]);
    }
  }

  // 4. Set payload exactly like React
  fd.set("name", "Test JS URL");
  fd.set("introeditor[text]", "Hello world");
  fd.set("introeditor[format]", "1");
  fd.set("externalurl", "https://google.com");
  fd.set("submitbutton", "Kaydet ve derse dön");

  // 5. POST
  const postReq = await fetch(formUrl, {
    method: "POST",
    headers: { "Cookie": cookieStr },
    body: fd,
    redirect: "manual"
  });

  console.log("Status:", postReq.status);
  console.log("Location:", postReq.headers.get("location"));
  
  const postText = await postReq.text();
  fs.writeFileSync("post_debug.html", postText);
  console.log("Response body length:", postText.length);
}

testPost().catch(console.error);
