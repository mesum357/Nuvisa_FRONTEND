import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>

        {/* ===== FAVICONS ===== */}
        <link rel="icon" href="/favicon.ico" />
        
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />

        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />

        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png" />

        <link rel="apple-touch-icon" href="/favicon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />


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

        {/* ===== SCRIPTS ===== */}
        <script async src="https://pay.google.com/gp/p/js/pay.js" />
        <script async src="https://js.stripe.com/v3/"></script>

      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
