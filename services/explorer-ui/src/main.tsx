import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "~/styles/global.css";
import { QueryProvider, TanstackRouterProvider, ThemeProvider } from "./providers";

// NOTE: these two lines are necessary for proper parsing of ChicmozL2Block
import { Buffer } from "buffer";
import { Toaster } from "./components/ui/sonner";
import { SuccessIcon } from "./assets";
window.Buffer = window.Buffer || Buffer;

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider>
        <QueryProvider>
          <TanstackRouterProvider />
          <Toaster
            icons={{
              success: <SuccessIcon />,
            }}
          />
        </QueryProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
