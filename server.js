require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

app.get('/card', async (req, res) => {
  // Get the ID of a card to be shown
  const cardToBeShown = await pool.query(
    "SELECT id FROM holstee WHERE (last_shown IS NULL OR last_shown < NOW() - INTERVAL '1 month') AND (last_answered IS NULL OR last_answered < NOW() - INTERVAL '1 year') ORDER BY RANDOM() LIMIT 1"
  );
  const cardId = cardToBeShown.rows[0]?.id;

  if (cardId) {
    // Update last_shown for this card
    await pool.query('UPDATE holstee SET last_shown = NOW() WHERE id = $1', [
      cardId,
    ]);

    // Fetch and return the updated card
    const result = await pool.query('SELECT * FROM holstee WHERE id = $1', [
      cardId,
    ]);
    res.json(result.rows[0]);
  } else {
    res.status(404).json({ message: 'No card available' });
  }
});

app.put('/card/:id/answer', async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'UPDATE holstee SET last_answered = NOW() WHERE id = $1',
    [id]
  );
  res.json(result.rowCount > 0);
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});

app.delete('/card/:id', async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM holstee WHERE id = $1', [id]);
  res.json(result.rowCount > 0);
});
