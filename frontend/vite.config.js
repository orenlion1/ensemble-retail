import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import faroUploader from '@grafana/faro-rollup-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const faroSourceMapConfigured = Boolean(
    env.FARO_SOURCEMAP_ENDPOINT &&
    env.FARO_SOURCEMAP_API_KEY &&
    env.FARO_APP_ID &&
    env.FARO_STACK_ID
  );

  return {
    plugins: [
      react(),
      faroSourceMapConfigured && faroUploader({
        appName: 'ensemble-grafana',
        endpoint: env.FARO_SOURCEMAP_ENDPOINT,
        apiKey: env.FARO_SOURCEMAP_API_KEY,
        appId: env.FARO_APP_ID,
        stackId: env.FARO_STACK_ID,
        bundleId: env.FARO_BUNDLE_ID,
        gzipContents: true,
        keepSourcemaps: env.FARO_KEEP_SOURCEMAPS === 'true',
        prefixPath: env.FARO_SOURCEMAP_PREFIX_PATH,
        prefixPathBasenameOnly: env.FARO_SOURCEMAP_PREFIX_BASENAME_ONLY === 'true',
        verbose: env.FARO_SOURCEMAP_VERBOSE === 'true'
      })
    ].filter(Boolean),
    build: {
      sourcemap: faroSourceMapConfigured
    },
    server: {
      port: 5173,
      proxy: {
        '/api/inventory': {
          target: 'http://localhost:8081',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/inventory/, '')
        },
        '/api/cart': {
          target: 'http://localhost:8082',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/cart/, '')
        },
        '/api/account': {
          target: 'http://localhost:8083',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/account/, '')
        }
      }
    }
  };
});
