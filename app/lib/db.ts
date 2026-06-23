import postgres from "postgres";

declare global {
  var sqlClient: ReturnType<typeof postgres> | undefined;
}

const sql = globalThis.sqlClient ?? postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

globalThis.sqlClient = sql;

// if (process.env.NODE_ENV !== 'production') {
//   globalThis.sqlClient = sql;
// }

export default sql;