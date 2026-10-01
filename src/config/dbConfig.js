const dbConfig = {
  dbC: {
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_DATABASE || "postgres",
    password: process.env.DB_PASSWORD || "123456",
    port: process.env.DB_PORT || 5432,
    client_encoding: "UTF8",
  },
};

export default dbConfig;
