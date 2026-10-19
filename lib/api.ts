import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodTypeAny, z } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function formatZodError(error: ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  return `Invalid input - ${issues.join('; ')}`;
}

// Convert any thrown value into a JSON response with a proper status code.
// Unexpected errors are logged server-side and returned as a generic message
// so internal details (SQL, stack, config) never reach the client.
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json({ error: formatZodError(error) }, { status: 400 });
  }

  const err = error as { message?: string; code?: string } | null;

  if (err?.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // PostgREST: .single() matched zero rows
  if (err?.code === 'PGRST116') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Postgres: invalid input syntax (e.g. malformed UUID), FK / check violations
  if (err?.code === '22P02' || err?.code === '23503' || err?.code === '23514') {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }

  console.error('API error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// Parse and validate a JSON request body. Unknown keys are stripped by the schema.
export async function parseBody<S extends ZodTypeAny>(
  req: NextRequest,
  schema: S
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON');
  }
  return schema.parse(raw);
}

// Parse and validate URL search params.
export function parseQuery<S extends ZodTypeAny>(
  req: NextRequest,
  schema: S
): z.infer<S> {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  return schema.parse(params);
}
