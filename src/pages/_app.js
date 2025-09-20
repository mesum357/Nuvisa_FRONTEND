import ToastProvider from "@/contexts/ToastContext";
import ReduxProvider from "@/store/redux-provider";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <ReduxProvider>
      <ToastProvider  >
        <Component {...pageProps} />
      </ToastProvider>
    </ReduxProvider>
  );
}
