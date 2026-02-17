import './env.js';
import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// DEBUG: log all queries and parameters (Pool and Client)
const DEBUG = true;
if (DEBUG) {
  const { Client, Pool } = pkg;

  // Wrap Pool.prototype.query
  const origPoolQuery = Pool.prototype.query;
  Pool.prototype.query = function (text, params, ...rest) {
    console.log('[pg][Pool.query]', text);
    if (params) console.log('[pg][params]', params);
    return origPoolQuery.call(this, text, params, ...rest);
  };

  // Wrap Client.prototype.query
  const origClientQuery = Client.prototype.query;
  Client.prototype.query = function (text, params, ...rest) {
    console.log('[pg][Client.query]', text);
    if (params) console.log('[pg][params]', params);
    return origClientQuery.call(this, text, params, ...rest);
  };
}