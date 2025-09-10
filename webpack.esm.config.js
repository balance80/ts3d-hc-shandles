import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: './dev/public/js/hcSHandles/hcSHandles.js',
  experiments: { outputModule: true },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'hcSHandles.module.min.js',
    library: { type: 'module' },
    module: true,
  },

  // 👉 Do not bundle the viewer; keep the import as-is
  externalsType: 'module',
  externals: {
    '@hoops/web-viewer/hoops-web-viewer.mjs': '@hoops/web-viewer/hoops-web-viewer.mjs',
  },
};
