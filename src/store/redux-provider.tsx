import React, { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { store } from "./index";
import { persistStore } from "redux-persist";
import { setAuthState } from "./authSlice";

persistStore(store);

function InnerProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      if (typeof document !== "undefined") {
        const match = document.cookie.match(
          new RegExp("(^| )" + "token" + "=([^;]+)")
        );
        const hasToken = !!(match && match[2]);
        dispatch(setAuthState(hasToken));
      }
    } catch {}
    const onFocus = () => {
      try {
        if (typeof document !== "undefined") {
          const m = document.cookie.match(
            new RegExp("(^| )" + "token" + "=([^;]+)")
          );
          const hasT = !!(m && m[2]);
          dispatch(setAuthState(hasT));
        }
      } catch {}
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [dispatch]);

  return <>{children}</>;
}

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <InnerProvider>{children}</InnerProvider>
    </Provider>
  );
}
