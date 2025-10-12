const { Pool } = require('pg');
// Environment variables are loaded in index.js

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,        // default 5432
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  max: 20,    // optional: max number of clients in pool
  idleTimeoutMillis: 30000,  // close idle clients after 30s
  connectionTimeoutMillis: 2000,  // return error after 2s if cannot connect
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),  // for transactions
};
