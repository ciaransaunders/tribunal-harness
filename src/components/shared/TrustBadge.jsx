export default function TrustBadge({ verified, confidence }) {
    if (verified && confidence === "high") {
        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    background: "rgba(45, 212, 191, 0.15)",
                    color: "#2dd4bf",
                    border: "1px solid rgba(45, 212, 191, 0.3)",
                }}
            >
                ✓ VERIFIED
            </span>
        );
    }
    if (verified && confidence === "medium") {
        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    background: "rgba(251, 191, 36, 0.15)",
                    color: "#fbbf24",
                    border: "1px solid rgba(251, 191, 36, 0.3)",
                }}
            >
                ⚠ CHECK
            </span>
        );
    }
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
        >
            ✗ UNVERIFIED
        </span>
    );
}
