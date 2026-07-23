import postgres from "postgres";

/** Lightweight readiness probe. Does not share the app pool. */
export async function pingDatabase(connectionString: string): Promise<void> {
  const client = postgres(connectionString, { max: 1, connect_timeout: 3 });
  try {
    await client`select 1`;
  } finally {
    await client.end({ timeout: 2 });
  }
}
