export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) {
    throw new Error('Missing request origin');
  }

  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin) {
    throw new Error('Invalid request origin');
  }
}
