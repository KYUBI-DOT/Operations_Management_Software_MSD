const bcrypt = require('bcrypt');
const pwd = process.argv.slice(2).join(' ');
bcrypt.hash(pwd, 10).then(h => { console.log(h); process.exit(0); });
