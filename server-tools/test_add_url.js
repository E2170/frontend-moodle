import { exec } from "child_process";
import https from "https";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

exec(`sshpass -p 'q1w2e3r4' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 root@192.168.1.177 "PGPASSWORD='123' psql -h 192.168.1.182 -U moodleuser -d moodle -c \\"SELECT u.username, t.token FROM mdl_external_tokens t JOIN mdl_user u ON t.userid = u.id WHERE u.username = 'hoca1' LIMIT 1;\\""`, async (err, stdout) => {
    const m = stdout.match(/hoca1\s*\|\s*([a-f0-9]{32})/);
    if (!m) return console.log("No token for hoca1");
    const token = m[1];
    
    // First, let's find a course ID
    const coursesRes = await fetch("https://moodle.argeyazilim.tr/webservice/rest/server.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ wstoken: token, wsfunction: 'core_enrol_get_users_courses', moodlewsrestformat: 'json', userid: '3' }).toString()
    });
    const courses = await coursesRes.json();
    const courseId = courses[0].id;
    console.log("Using course:", courseId);

    const params = new URLSearchParams({
        wstoken: token,
        wsfunction: 'local_vueapi_add_activity',
        moodlewsrestformat: 'json',
        courseid: courseId,
        section: '1',
        type: 'url',
        name: 'Test Youtube',
        externalurl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    });
    
    const res = await fetch("https://moodle.argeyazilim.tr/webservice/rest/server.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "MoodleMobile" },
        body: params.toString()
    });
    const data = await res.json();
    console.log("Add URL response:", JSON.stringify(data, null, 2));
});
