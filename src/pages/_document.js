import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="msapplication-TileImage" content="/favicon.ico" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/favicon.ico" />
        <meta property="og:image:type" content="image/x-icon" />
        <meta property="og:image:width" content="32" />
        <meta property="og:image:height" content="32" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content="/favicon.ico" />
        
        {/* Additional meta tags for search engines */}
        <meta name="theme-color" content="#7350FF" />
        
        <script
          async
          src="https://pay.google.com/gp/p/js/pay.js"
          onLoad={() => console.log('Google Pay API loaded')}
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
