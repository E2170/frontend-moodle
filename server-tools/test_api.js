import https from "https";
import { exec } from "child_process";

// Use native fetch but bypass SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testToken(token, desc, bbbid) {
    console.log(`\n--- Testing ${desc} ---`);
    const params = new URLSearchParams({
        wstoken: token,
        wsfunction: 'mod_bigbluebuttonbn_get_recordings',
        moodlewsrestformat: 'json',
        bigbluebuttonbnid: bbbid,
        groupid: '0'
    });
    
    try {
        const res = await fetch("https://moodle.argeyazilim.tr/webservice/rest/server.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "MoodleMobile"
            },
            body: params.toString()
        });
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2).substring(0, 500));
    } catch (e) {
        console.log("Error:", e.message);
    }
}

exec(`sshpass -p 'q1w2e3r4' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 root@192.168.1.177 "PGPASSWORD='123' psql -h 192.168.1.182 -U moodleuser -d moodle -c \\"SELECT u.username, t.token FROM mdl_external_tokens t JOIN mdl_user u ON t.userid = u.id WHERE u.username IN ('teacher', 'student', 'admin', 'root', 'akuzem', 'ogr1', 'ogr2', 'hoca1') LIMIT 10;\\""`, async (err, stdout) => {
    console.log(stdout);
    const tokens = [];
    stdout.split("\n").forEach(line => {
        const m = line.match(/^\s*(\w+)\s*\|\s*([a-f0-9]{32})/);
        if (m) tokens.push({ user: m[1], token: m[2] });
    });
    console.log(tokens);
    for (const t of tokens) {
        await testToken(t.token, t.user, '47');
    }
});
