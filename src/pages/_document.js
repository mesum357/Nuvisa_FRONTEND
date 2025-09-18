import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
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
