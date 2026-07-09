async function testPost() {
  const cookieStr = "MoodleSession=30uhp1on1dkq2rridokfna499b; MOODLEID1_=-%2585%25EF%25EFaN%25A8%2592%25E7Q";
  const formUrl = "https://moodle.argeyazilim.tr/course/modedit.php?add=quiz&type=&course=6371&section=0&return=0&sr=0";
  
  console.log("1. GET formUrl...");
  const getReq = await fetch(formUrl, { headers: { "Cookie": cookieStr } });
  const html = await getReq.text();
  
  const sesskeyMatch = html.match(/name="sesskey" value="([^"]+)"/);
  if (!sesskeyMatch) {
    console.log("sesskey not found. Login failed?");
    return;
  }
  
  const sesskey = sesskeyMatch[1];
  console.log("Sesskey:", sesskey);
  
  const urlEncoded = new URLSearchParams();
  urlEncoded.append("sesskey", sesskey);
  urlEncoded.append("course", "6371");
  urlEncoded.append("section", "0");
  urlEncoded.append("module", "1"); // Assign
  urlEncoded.append("modulename", "assign");
  urlEncoded.append("instance", "");
  urlEncoded.append("add", "assign");
  urlEncoded.append("update", "0");
  urlEncoded.append("return", "0");
  urlEncoded.append("sr", "0");
  urlEncoded.append("name", "Test Assign");
  urlEncoded.append("introeditor[text]", "Test");
  urlEncoded.append("introeditor[format]", "1");
  urlEncoded.append("submitbutton", "Kaydet ve derse dön");
  
  console.log("2. POST formUrl...");
  const postReq = await fetch(formUrl.replace("add=quiz", "add=assign"), {
    method: "POST",
    headers: { 
      "Cookie": cookieStr,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: urlEncoded.toString(),
    redirect: "manual"
  });
  
  console.log("Status:", postReq.status);
  console.log("Headers:", Object.fromEntries(postReq.headers.entries()));
  const postHtml = await postReq.text();
  console.log("Response Body (first 1000 chars):", postHtml.substring(0, 1000));
}
testPost().catch(console.error);
