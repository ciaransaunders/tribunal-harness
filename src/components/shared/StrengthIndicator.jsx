export default function StrengthIndicator({ strength }) {
    const colors = {
        strong: { bg: "rgba(45, 212, 191, 0.12)", color: "#2dd4bf", label: "STRONG" },
        moderate: { bg: "rgba(251, 191, 36, 0.12)", color: "#fbbf24", label: "MODERATE" },
        weak: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444", label: "WEAK" },
    };
    const s = colors[strength] || colors.moderate;
    return (
        <span
            style={{
                padding: "2px 8px",
                borderRadius: "3px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.8px",
                background: s.bg,
                color: s.color,
                border: `1px solid ${s.color}33`,
            }}
        >
            {s.label}
        </span>
    );
}
