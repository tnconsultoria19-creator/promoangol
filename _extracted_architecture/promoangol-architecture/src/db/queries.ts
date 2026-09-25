export async function query<T = unknown>(db: D1Database, sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await db.prepare(sql).bind(...params).all<T>();
  return result.results ?? [];
}

export async function execute(db: D1Database, sql: string, params: unknown[] = []): Promise<D1Result> {
  return db.prepare(sql).bind(...params).run();
}
