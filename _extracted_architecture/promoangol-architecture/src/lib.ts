export type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export function json(data: Json, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
  });
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function routeId(prefix: string, serial: number): string {
  return `${prefix}-${new Date().getUTCFullYear()}-${String(serial).padStart(8, "0")}`;
}
