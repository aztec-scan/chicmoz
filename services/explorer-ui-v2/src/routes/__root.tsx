import { Outlet, createRootRoute } from "@tanstack/react-router";
import { lazy } from "react";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "development"
    ? lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      )
    : () => null;

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: "120px auto",
        textAlign: "center",
        fontFamily: "var(--mono)",
        color: "var(--ink-2)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginBottom: 12,
        }}
      >
        404 · not found
      </div>
      <div style={{ fontSize: 22, color: "var(--ink-1)", marginBottom: 8 }}>
        Page does not exist
      </div>
      <div style={{ fontSize: 12 }}>
        <a href="/" style={{ color: "var(--purple)" }}>
          back to home →
        </a>
      </div>
    </div>
  );
}
