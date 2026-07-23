import { exec } from "child_process";
import https from "https";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

exec(`sshpass -p 'q1w2e3r4' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 root@192.168.1.177 "PGPASSWORD='123' psql -h 192.168.1.182 -U moodleuser -d moodle -c \\"SELECT u.username, t.token FROM mdl_external_tokens t JOIN mdl_user u ON t.userid = u.id WHERE u.username = 'hoca1' LIMIT 1;\\""`, async (err, stdout) => {
    const m = stdout.match(/hoca1\s*\|\s*([a-f0-9]{32})/);
    if (!m) return console.log("No token for hoca1");
    const token = m[1];
    
    const params = new URLSearchParams({
        wstoken: token,
        wsfunction: 'mod_bigbluebuttonbn_get_recordings',
        moodlewsrestformat: 'json',
        bigbluebuttonbnid: '47',
        groupid: '0'
    });
    
    const res = await fetch("https://moodle.argeyazilim.tr/webservice/rest/server.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "MoodleMobile" },
        body: params.toString()
    });
    const data = await res.json();
    console.log("Teacher recordings response:", JSON.stringify(data, null, 2).substring(0, 500));
});
