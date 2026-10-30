import handler from 'vinext/server/fetch-handler';
import { restaurant } from '../content/restaurant';

const primary = new URL(restaurant.siteUrl);

// Search engines should find one address per page: HTTPS on the bare domain.
function primaryAddress(url: URL) {
  const isWww = url.hostname === 'www.' + primary.hostname;
  const isPlainHttp = url.hostname === primary.hostname && url.protocol === 'http:';
  return isWww || isPlainHttp ? new URL(url.pathname + url.search, primary) : null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const redirect = primaryAddress(url);
    if (redirect) return Response.redirect(redirect.toString(), 301);
    const response = await handler.fetch(request, env, ctx);
    // The workers.dev address stays open for checks but must not compete with the real domain in search results.
    if (!url.hostname.endsWith('.workers.dev')) return response;
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
} satisfies ExportedHandler<CloudflareBindings>;
