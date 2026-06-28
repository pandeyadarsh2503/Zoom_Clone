"use client";

/**
 * Last-resort boundary for errors thrown in the root layout itself. It replaces
 * the entire document, so it must render its own <html>/<body> and cannot rely
 * on the app's global stylesheet — styles are inline.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f8fa",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          color: "#1f2937",
        }}
      >
        <div style={{ textAlign: "center", padding: 24, maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
            The application hit an unexpected error. Please reload.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              height: 40,
              padding: "0 20px",
              borderRadius: 8,
              border: "none",
              background: "#0E72ED",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
