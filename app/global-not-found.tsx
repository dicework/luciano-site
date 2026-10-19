/* eslint-disable next/no-html-link-for-pages -- Native links avoid broken navigation exports in Vinext's production Link bundle. */
import './globals.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/cyrillic-400.css';
export const metadata = {
  title: '404 · Luchiano',
  robots: { index: false, follow: false },
};
export default function NotFound() {
  return (
    <html lang="bg">
      <body>
        <main id="main" className="wrap not-found">
          <section lang="bg">
            <p className="eyebrow">404</p>
            <h1>Тази страница не е намерена.</h1>
            <a className="btn btn-red" href="/menu/">
              Към менюто ↗
            </a>
          </section>
          <section lang="en">
            <h2>This page could not be found.</h2>
            <a className="btn btn-outline" href="/en/menu/">
              Back to the menu ↗
            </a>
          </section>
        </main>
      </body>
    </html>
  );
}
