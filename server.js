/**
 * Local Express server for the RIF experiment.
 *
 * Usage:
 *   cd experiment && npm install && node server.js
 *   Open http://localhost:3000/   (auto-serves index.html)
 *
 * Saves every POST /save-data to ./data/RIF_<pid>_<cond>_<ts>.json
 */

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

app.post('/save-data', (req, res) => {
  try {
    const { participant_id, condition, data } = req.body;
    if (!participant_id || !data) {
      return res.status(400).json({ success: false, error: 'missing fields' });
    }
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const fn = `RIF_${participant_id}_${condition || 'X'}_${ts}.json`;
    fs.writeFileSync(path.join(DATA_DIR, fn),
                     JSON.stringify(data, null, 2), 'utf8');
    console.log('[saved]', fn);
    res.json({ success: true, filename: fn });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/data-files', (req, res) => {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  res.json({ count: files.length, files });
});

app.listen(PORT, () => {
  console.log(`\nRIF experiment server: http://localhost:${PORT}\n`);
  console.log(`Data dir: ${DATA_DIR}\n`);
});
