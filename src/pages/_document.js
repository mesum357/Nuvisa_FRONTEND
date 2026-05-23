import { Html, Head, Main, NextScript } from "next/document";

const GTM_ID = "GTM-K2KZ5XR4";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* GTM + payment scripts load via _app (lazy / checkout-only) */}
        <link
          rel="preload"
          href="/fonts/gilroy-bold/Gilroy-Medium.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/gilroy-bold/Gilroy-Bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />

        {/* ===== FAVICONS ===== */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png?v=2"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png?v=2"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="48x48"
          href="/favicon-48x48.png?v=2"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/favicon-96x96.png?v=2"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/favicon-192x192.png?v=2"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/favicon-512x512.png?v=2"
        />
        <link rel="apple-touch-icon" href="/favicon-192x192.png?v=2" />
        <link rel="manifest" href="/manifest.json?v=2" />

        {/* ===== META / SOCIAL ===== */}
        <meta name="theme-color" content="#7350FF" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/image/logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/image/logo.png" />
      </Head>
      <body className="antialiased">
        {/* GTM noscript fallback */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
