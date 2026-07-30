process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const token = 'fa57430e559fea765a3b8e62d05fec17';
fetch(`https://moodle.argeyazilim.tr/webservice/rest/server.php?wstoken=${token}&wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json&userid=2`, {
  method: 'POST'
}).then(res => res.json()).then(data => {
  console.log(JSON.stringify(data, null, 2));
});
