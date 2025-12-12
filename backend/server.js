const express = require('express');
const app = express();
const PORT = 3000;

app.get('/api/status', (req, res) => {
  res.json({ status: 'Running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
