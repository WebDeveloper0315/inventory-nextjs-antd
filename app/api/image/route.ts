import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: Request): Promise<Response> {
  if (!process.env.NEXT_PUBLIC_IMAGES_PATH) {
    throw new Error('NEXT_PUBLIC_IMAGES_PATH is not set');
  }

  const url = new URL(request.url);
  const image = url.searchParams.get('key');

  if (image?.trim()) {
    const imagePath = path.join('public', process.env.NEXT_PUBLIC_IMAGES_PATH, `${image}`);

    if (fs.existsSync(imagePath)) {
      const buffer = fs.readFileSync(imagePath);

      return new Response(buffer, {
        headers: {
          'Content-Type': 'image/png',
        },
      });
    } else {
      return new Response('', { status: 404 });
    }
  }

  return new Response('', { status: 400 });
}
