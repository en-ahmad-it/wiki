type Props = {
  name?: string;
  pageviews: number;
  articleTitle?: string;
  articleUrl?: string;
};

const CelebrationTemplate = ({
  name,
  pageviews,
  articleTitle,
  articleUrl,
}: Props) => {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#f8fafc",
          margin: 0,
          padding: 20,
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
          color: "#0f172a",
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          role="presentation"
          style={{ maxWidth: 600, margin: "0 auto" }}
        >
          <tr>
            <td style={{ paddingBottom: 12 }}>
              <div style={{ textAlign: "left" }}>
                <strong style={{ fontSize: 18, color: "#0f172a" }}>
                  Wikimasters
                </strong>
              </div>
            </td>
          </tr>

          <tr>
            <td>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 8,
                  padding: 24,
                  boxShadow: "0 1px 0 rgba(15,23,42,0.04)",
                }}
              >
                <h1
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: 20,
                    lineHeight: "28px",
                  }}
                >
                  🎉 Nice work{name ? `, ${name}` : ""}!
                </h1>

                <p style={{ margin: "0 0 16px 0", color: "#334155" }}>
                  Your article{articleTitle ? ` "${articleTitle}"` : ""} just
                  hit <strong>{pageviews}</strong> views — that's a milestone.
                </p>

                {articleUrl ? (
                  <a
                    href={articleUrl}
                    style={{
                      display: "inline-block",
                      textDecoration: "none",
                      background: "#0ea5a4",
                      color: "white",
                      padding: "10px 14px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    View article
                  </a>
                ) : null}

                <p style={{ marginTop: 18, color: "#94a3b8", fontSize: 13 }}>
                  Keep writing — you're helping other people learn. — The
                  Wikimasters team
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style={{ paddingTop: 14 }}>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>
                You’re receiving this email because you authored content on
                Wikimasters.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};

export default CelebrationTemplate;
