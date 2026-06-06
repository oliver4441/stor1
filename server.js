import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 10000;

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — serve index.html for non-file routes
app.get('*', (req, res) => {
  if (!req.path.includes('.')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, () => console.log(`Omix running on port ${PORT}`));
