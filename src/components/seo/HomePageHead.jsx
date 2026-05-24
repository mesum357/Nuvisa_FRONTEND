import Head from "next/head";

const SITE_URL = "https://www.nuvisa.co.uk";
const DEFAULT_TITLE = "NUvisa | Schengen Visa Application — Fast, Simple & Affordable";
const DEFAULT_DESCRIPTION =
  "Apply for your Schengen visa online with NUvisa. Flat £200 fee, faster processing, document pre-checks, and 24/7 support — 99.3% approval rate.";

export default function HomePageHead({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}) {
  const ogImage = `${SITE_URL}/image/logo.png`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`${SITE_URL}/`} />
      <meta name="robots" content="index, follow" />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${SITE_URL}/`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="NUvisa" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "NUvisa",
            url: SITE_URL,
            logo: ogImage,
            description: DEFAULT_DESCRIPTION,
          }),
        }}
      />
    </Head>
  );
}
