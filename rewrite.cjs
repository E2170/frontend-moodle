const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We want to replace:
      // await fetch(`/api/webservice/rest/server.php?wstoken=${token}&wsfunction=...`);
      // with a POST request.
      
      const regex = /fetch\(\s*`\/api\/webservice\/rest\/server\.php\?([^`]+)`\s*\)/g;
      const newContent = content.replace(regex, (match, queryStr) => {
        return `fetch(\`/api/webservice/rest/server.php\`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: \`${queryStr}\`
        })`;
      });

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

processDir(srcDir);
