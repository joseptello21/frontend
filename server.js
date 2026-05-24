const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const staticDir = path.join(__dirname, 'browser', 'browser');

app.use(express.static(staticDir, { maxAge: '1d' }));

// SPA fallback for Angular routes
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
