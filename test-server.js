const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Server is working!' });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on port ${port}`);
}); 