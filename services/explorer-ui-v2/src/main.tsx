import { Buffer } from "buffer";
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "~/styles/global.css";
import {
  QueryProvider,
  TanstackRouterProvider,
  ThemeProvider,
} from "./providers";

// ChicmozL2Block parsing depends on Buffer being available on window.
window.Buffer = window.Buffer || Buffer;

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider>
        <QueryProvider>
          <Suspense fallback={null}>
            <TanstackRouterProvider />
          </Suspense>
        </QueryProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
