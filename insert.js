import { Client } from "pg";
import parse from "./parse.js";
import conf from "./dbConfig.js";

const dbConfig = conf.dbC;

/**
 * @param {string} filePath - full or relative path
 * @param {string} tableName - Postgre table name
 * @returns {Promise<void>} adds table to Postgre db
 */
async function insert(filePath, tableName) {
  // table name validation
  const safeTableName = tableName.toLowerCase().trim();

  // client for every request
  const client = new Client(dbConfig);

  try {
    const fullerenData = await parse.prc(filePath);

    if (!fullerenData || fullerenData.length === 0) {
      console.log(`[${tableName}] NO DATA to extract!`);
      return;
    }

    await client.connect();

    // delete old table, if exists
    const dropTableQuery = `DROP TABLE IF EXISTS ${safeTableName} CASCADE;`;
    await client.query(dropTableQuery);

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${safeTableName} (
        id SERIAL PRIMARY KEY,
        atom_number INT,
        energy NUMERIC,
        x NUMERIC,
        y NUMERIC,
        z NUMERIC,
        connection_count INT,
        connections INT[],
        connection_types TEXT[]
      );
    `;
    await client.query(createTableQuery);

    // (Bulk Insert)
    const values = [];
    const valuePlaceholders = [];
    let placeholderIndex = 1;

    fullerenData.forEach((atom, index) => {
      valuePlaceholders.push(`(
        $${placeholderIndex++}, $${placeholderIndex++}, $${placeholderIndex++}, 
        $${placeholderIndex++}, $${placeholderIndex++}, $${placeholderIndex++}, 
        $${placeholderIndex++}, $${placeholderIndex++}
      )`);

      values.push(
        index + 1,
        atom.Energy,
        atom.x,
        atom.y,
        atom.z,
        atom.conectionCount,
        atom.connections,
        atom.conTypes,
      );
    });

    const insertQuery = `
      INSERT INTO ${safeTableName} (
        atom_number, energy, x, y, z, connection_count, connections, connection_types
      ) 
      VALUES ${valuePlaceholders.join(", ")};
    `;

    const res = await client.query(insertQuery, values);
    console.log(
      `[${tableName}] Table created sucessfully, rows added: ${res.rowCount}`,
    );
  } catch (err) {
    console.error(`[${tableName}] Execute error:`, err.message);
  } finally {
    await client.end();
  }
}

// inserts should be ordered one by one

//export default { ParseHin: insert };
export { insert as ParseHin };
