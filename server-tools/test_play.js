import https from "https";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function test() {
    const res = await fetch("https://moodle.argeyazilim.tr/local/vueapi/login_and_join.php?token=fa57430e559fea765a3b8e62d05fec17&action=play&rid=1&bn=47", { redirect: 'manual' });
    console.log("Status:", res.status);
    console.log("Location:", res.headers.get('location'));
}
test();
