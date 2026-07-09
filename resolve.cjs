const dns = require('dns');
dns.lookup('moodle.argeyazilim.tr', (err, address, family) => {
  console.log('address: %j family: IPv%s', address, family);
});
