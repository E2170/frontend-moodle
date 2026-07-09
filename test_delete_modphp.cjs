const cookieStr = "MoodleSession=30uhp1on1dkq2rridokfna499b; MOODLEID1_=-%2585%25EF%25EFaN%25A8%2592%25E7Q";
const sesskey = "OZZUdfYBS9"; // From earlier test

const payload = [{
  index: 0,
  methodname: "core_course_edit_module",
  args: { id: 7075, action: "delete", sectionreturn: 0 }
}];

fetch("http://127.0.0.1:5173/api/lib/ajax/service.php?sesskey=" + sesskey, {
  method: "POST",
  headers: { 
    "Cookie": cookieStr,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
}).then(res => res.text()).then(console.log).catch(console.error);
