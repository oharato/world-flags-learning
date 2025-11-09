import { handle } from 'hono/cloudflare-pages';
import app from './server'; // Honoアプリをインポート

export const onRequest = handle(app);
