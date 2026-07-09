async function testMoodlePost() {
  const token = process.argv[2];
  if (!token) {
    console.log("Token eksik. Kullanım: node test_post.js <token>");
    return;
  }
  
  console.log("1. Autologin URL alınıyor...");
  const params = new URLSearchParams({ wstoken: token, wsfunction: "tool_mobile_get_autologin_key", privatetoken: token, moodlewsrestformat: "json" });
  
  const autoLoginRes = await fetch("https://moodle.argeyazilim.tr/webservice/rest/server.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  }).then(r => r.json());
  
  if (!autoLoginRes.autologinurl) {
    console.log("Autologin alınamadı", autoLoginRes);
    return;
  }
  
  console.log("2. Autologin yapılıyor, çerezler alınıyor...");
  let cookies = [];
  const autoLoginReq = await fetch(autoLoginRes.autologinurl, { redirect: "manual" });
  if (autoLoginReq.headers.get("set-cookie")) {
    cookies = autoLoginReq.headers.get("set-cookie").split(',').map(c => c.split(';')[0]);
  }
  
  const cookieStr = cookies.join("; ");
  console.log("Cookies:", cookieStr);
  
  console.log("3. Form sayfası (GET) çekiliyor...");
  const formUrl = "https://moodle.argeyazilim.tr/course/modedit.php?add=url&type=&course=6371&section=0&return=0&sr=0";
  const getReq = await fetch(formUrl, {
    headers: { "Cookie": cookieStr }
  });
  
  const html = await getReq.text();
  const sesskeyMatch = html.match(/name="sesskey" value="([^"]+)"/);
  if (!sesskeyMatch) {
    console.log("Sesskey bulunamadı! HTML:", html.substring(0, 300));
    return;
  }
  
  const sesskey = sesskeyMatch[1];
  console.log("Sesskey:", sesskey);
  
  // 4. Formu POST et
  const fd = new FormData();
  fd.append("sesskey", sesskey);
  fd.append("course", "6371");
  fd.append("section", "0");
  fd.append("module", "20"); // url
  fd.append("modulename", "url");
  fd.append("instance", "");
  fd.append("add", "url");
  fd.append("update", "0");
  fd.append("return", "0");
  fd.append("sr", "0");
  fd.append("name", "Test URL");
  fd.append("externalurl", "https://google.com");
  fd.append("introeditor[text]", "Test");
  fd.append("introeditor[format]", "1");
  fd.append("submitbutton", "Kaydet ve derse dön");
  
  console.log("4. POST gönderiliyor...");
  const postReq = await fetch(formUrl, {
    method: "POST",
    headers: {
      "Cookie": cookieStr
    },
    body: fd,
    redirect: "manual"
  });
  
  console.log("POST Status:", postReq.status);
  console.log("POST Headers:", Object.fromEntries(postReq.headers.entries()));
  
  const postText = await postReq.text();
  console.log("POST Body uzunluğu:", postText.length);
  if (postReq.status === 404 || postReq.status === 200) {
    console.log("POST Body (hata):", postText.substring(0, 800));
    
    // Hataları ayrıştır
    const matchErrors = [...postText.matchAll(/<span class="error">([^<]+)<\/span>/g)];
    if (matchErrors.length) {
       console.log("BULUNAN HATALAR:");
       matchErrors.forEach(m => console.log("- " + m[1]));
    }
  }
}

testMoodlePost().catch(console.error);
