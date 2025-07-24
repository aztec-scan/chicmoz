const POSTGRES_IP = process.env.POSTGRES_IP ?? "localhost";
const POSTGRES_PORT = Number(process.env.POSTGRES_PORT) || 5432;
const POSTGRES_DB_NAME = process.env.POSTGRES_DB_NAME;
const POSTGRES_ADMIN = process.env.POSTGRES_ADMIN ?? "admin";
const POSTGRES_PASSWORD =
  process.env.POSTGRES_PASSWORD ?? "secret-local-password";

export const dbCredentials = {
  host: POSTGRES_IP,
  port: POSTGRES_PORT,
  user: POSTGRES_ADMIN,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB_NAME,
};

export const getConfigStr = () => {
  if (!POSTGRES_DB_NAME) {throw new Error("POSTGRES_DB_NAME is not set");}
  return `POSTGRES
POSTGRES_IP        ${POSTGRES_IP}
POSTGRES_PORT      ${POSTGRES_PORT}
POSTGRES_DB_NAME   ${POSTGRES_DB_NAME}
POSTGRES_ADMIN     ${POSTGRES_ADMIN}
POSTGRES_PASSWORD  ${
    POSTGRES_PASSWORD
      ? POSTGRES_PASSWORD.slice(0, 10).replace(/./g, "*")
      : "⚠️ No password provided ⚠️"
  }`;
};
