const fetch = globalThis.fetch;
async function test() {
  const res = await fetch('https://moodle.argeyazilim.tr/login/index.php');
  const text = await res.text();
  console.log('form action contains login:', !!text.match(/<form[^>]*action="[^"]*login[^"]*"[^>]*>/));
  console.log('form id=login:', !!text.match(/<form[^>]*id="login"[^>]*>/));
  console.log('username:', !!text.match(/name="username"/));
  console.log('password:', !!text.match(/name="password"/));
}
test();
