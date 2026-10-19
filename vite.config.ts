import vinext from 'vinext';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= 'false';
  process.env.WRANGLER_SEND_METRICS ??= 'false';
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  return {
    server: process.env.CODEX_SANDBOX === 'seatbelt'
      ? { watch: { useFsEvents: false, usePolling: true } }
      : {},
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        inspectorPort: false,
      }),
    ],
  };
});
