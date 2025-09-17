import ReduxProvider from "@/store/redux-provider";
import ToastProvider from "@/contexts/ToastContext";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <ReduxProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </ReduxProvider>
  );
}
