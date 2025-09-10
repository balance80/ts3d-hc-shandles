// webpack.iife.config.cjs
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './dev/public/js/hcSHandles/hcSHandles.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'hcSHandles.iife.min.js',
    // expose a global for your debug HTML
    library: { name: 'shandles', type: 'umd' },
    iife: true,
    clean: true,
  },

  // The viewer is loaded as a global (via <script src="...monolith.iife.js">),
  // so tell webpack to use window.Communicator instead of bundling it.
  externalsType: 'window',
  externals: {
    '@hoops/web-viewer/hoops-web-viewer.mjs': 'Communicator',
  },
};
