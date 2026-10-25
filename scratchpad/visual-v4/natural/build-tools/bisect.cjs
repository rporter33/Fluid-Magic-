const fs = require('fs'); const s = fs.readFileSync(process.argv[2], 'utf8').split('\n');
const starts = s.map((l, k) => (/^(function|const|let|\/\/ -)/.test(l) ? k : -1)).filter((k) => k >= 0); starts.push(s.length);
for (let a = 0; a < starts.length - 1; a++) { const chunk = s.slice(starts[a], starts[a + 1]).join('\n'); try { new Function(chunk); } catch (e) { console.log('chunk at line', starts[a] + 1, e.message); } }
