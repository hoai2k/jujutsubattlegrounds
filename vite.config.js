import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Dev-only sink: the viewer/game can POST canvas captures to /__shot so model
// iteration screenshots land in ./shots (never part of the build).
const shotSink = () => ({
  name: 'shot-sink',
  configureServer(server) {
    server.middlewares.use('/__shot', (req, res) => {
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        try {
          const { name, data } = JSON.parse(body);
          const dir = path.resolve(process.cwd(), 'shots');
          fs.mkdirSync(dir, { recursive: true });
          const b64 = data.replace(/^data:image\/png;base64,/, '');
          fs.writeFileSync(path.join(dir, String(name).replace(/[^\w-]/g, '') + '.png'), Buffer.from(b64, 'base64'));
          res.end('ok');
        } catch (e) { res.statusCode = 500; res.end(String(e)); }
      });
    });
  }
});

export default defineConfig({
  base: './',
  server: {
    // PORT lets a second dev session run alongside the default one
    port: Number(process.env.PORT) || 5173, strictPort: true,
    watch: { ignored: ['**/shots/**'] }
  },
  plugins: [shotSink()],
  build: {
    target: 'es2020', chunkSizeWarningLimit: 1200,
    // FOUR PAGES. The game at /, the developer workbench at /workbench/
    // (src/workbench), and the visitor dashboard at /stats/ (src/stats). All
    // three are listed explicitly because Vite only walks from the root
    // index.html otherwise, and the other two would never be built — they are
    // reached by URL, not by a link from the game.
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        workbench: fileURLToPath(new URL('./workbench/index.html', import.meta.url)),
        stats: fileURLToPath(new URL('./stats/index.html', import.meta.url)),
        // FOURTH PAGE: the fable5.1 redesign at /fable5.1/ (fable5.1/src),
        // a self-contained second build of the game — see docs/fable5.1-direction.md.
        fable51: fileURLToPath(new URL('./fable5.1/index.html', import.meta.url))
      }
    }
  }
});
