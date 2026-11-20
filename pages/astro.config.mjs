import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static site for Cloudflare Pages. The registration Worker stays in /worker
// and is not part of this build. The form posts to PUBLIC_WORKER_URL, or /submit
// on the same host when a route sends that path to the Worker.
export default defineConfig({
  site: 'https://origins.sonderplace.com',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});

