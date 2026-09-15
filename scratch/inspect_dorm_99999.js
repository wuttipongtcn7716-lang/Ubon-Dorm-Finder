const http = require('http');

http.get('http://localhost:3000/dorm/99999', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const flexIdx = d.indexOf('<div class="flex-1">');
    console.log('Flex-1 content:');
    console.log(d.substring(flexIdx, flexIdx + 1200));
  });
});
