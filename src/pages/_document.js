import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />

        {/* ===== META / SOCIAL ===== */}
        <meta name="theme-color" content="#7350FF" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        {/* Recommended: use a proper preview image, not favicon */}
        <meta property="og:image" content="/image/logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/image/logo.png" />

        {/* ===== SCRIPTS ===== */}
        <script
          async
          src="https://pay.google.com/gp/p/js/pay.js"
        />
        <script async src="https://js.stripe.com/v3/"></script>

      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
