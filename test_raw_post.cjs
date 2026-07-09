async function testPost() {
  const cookieStr = "MoodleSession=30uhp1on1dkq2rridokfna499b; MOODLEID1_=-%2585%25EF%25EFaN%25A8%2592%25E7Q";
  const formUrl = "https://moodle.argeyazilim.tr/course/modedit.php?add=assign&type=&course=6371&section=0&return=0&sr=0";
  
  console.log("1. GET formUrl...");
  const getReq = await fetch(formUrl, { headers: { "Cookie": cookieStr } });
  const html = await getReq.text();
  
  const sesskeyMatch = html.match(/name="sesskey" value="([^"]+)"/);
  if (!sesskeyMatch) {
    console.log("sesskey not found. Login failed?");
    return;
  }
  const sesskey = sesskeyMatch[1];
  
  const actionMatch = html.match(/<form[^>]+action="([^"]+)"/);
  const actionUrl = actionMatch ? actionMatch[1] : "modedit.php";
  console.log("Action URL:", actionUrl);
  
  // Create multipart payload manually to test what Moodle returns
  const FormData = require('form-data');
  const fd = new FormData();
  fd.append("sesskey", sesskey);
  fd.append("course", "6371");
  fd.append("section", "0");
  fd.append("module", "1"); // assign
  fd.append("modulename", "assign");
  fd.append("instance", "");
  fd.append("add", "assign");
  fd.append("update", "0");
  fd.append("return", "0");
  fd.append("sr", "0");
  fd.append("name", "Test Assign");
  fd.append("introeditor[text]", "Test");
  fd.append("introeditor[format]", "1");
  fd.append("submitbutton", "Kaydet ve derse dön");
  
  console.log("2. POST to Action URL...");
  const postUrl = new URL(actionUrl, "https://moodle.argeyazilim.tr/course/").href;
  console.log("POSTing to:", postUrl);
  const postReq = await fetch(postUrl, {
    method: "POST",
    headers: { 
      "Cookie": cookieStr,
      ...fd.getHeaders()
    },
    body: fd,
    redirect: "manual"
  });
  
  console.log("Status:", postReq.status);
  console.log("Headers:", Object.fromEntries(postReq.headers.entries()));
  if (postReq.status === 404) {
    const postHtml = await postReq.text();
    console.log("404 Body:", postHtml.substring(0, 1000));
  }
}
testPost().catch(console.error);
