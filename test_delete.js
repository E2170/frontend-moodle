async function testDelete() {
  const cookieStr = "MoodleSession=30uhp1on1dkq2rridokfna499b; MOODLEID1_=-%2585%25EF%25EFaN%25A8%2592%25E7Q";
  const sesskey = "OZZUdfYBS9"; // From earlier test
  
  const payload = [{
    index: 0,
    methodname: "core_course_delete_modules",
    args: { cmids: [7075] }
  }];
  
  const res = await fetch("https://moodle.argeyazilim.tr/lib/ajax/service.php?sesskey=" + sesskey, {
    method: "POST",
    headers: { 
      "Cookie": cookieStr,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}
testDelete().catch(console.error);
