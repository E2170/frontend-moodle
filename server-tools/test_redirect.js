import https from "https";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function test() {
    const res = await fetch("https://moodle.argeyazilim.tr/local/vueapi/get_recordings.php?token=fa57430e559fea765a3b8e62d05fec17&cmid=141&bbbid=47");
    const data = await res.json();
    console.log(JSON.stringify(data));
}
test();
