import ReduxProvider from "@/store/redux-provider";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <ReduxProvider>
      <Component {...pageProps} />
    </ReduxProvider>
  );
}
