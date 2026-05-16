import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

function Card({
  suit,
  color,
  rotation,
}: {
  suit: "spade" | "heart";
  color: string;
  rotation: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: suit === "spade" ? 36 : 18,
        left: suit === "spade" ? 26 : 70,
        width: 76,
        height: 110,
        borderRadius: 16,
        background: "#fffdf9",
        border: "4px solid rgba(214, 199, 178, 0.9)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "10px 12px",
        transform: `rotate(${rotation})`,
        boxShadow:
          suit === "spade"
            ? "0 14px 30px rgba(0, 0, 0, 0.28)"
            : "0 18px 40px rgba(0, 0, 0, 0.34)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          color,
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        <div>A</div>
        <div style={{ fontSize: 20 }}>{suit === "spade" ? "♠" : "♥"}</div>
      </div>
      <div
        style={{
          alignSelf: "center",
          color,
          fontSize: suit === "spade" ? 42 : 40,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {suit === "spade" ? "♠" : "♥"}
      </div>
    </div>
  );
}

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderRadius: 42,
          overflow: "hidden",
          background:
            "radial-gradient(circle at top, rgba(51, 132, 110, 0.28), transparent 54%), linear-gradient(180deg, #091419 0%, #071116 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 26,
            width: 108,
            height: 14,
            borderRadius: 999,
            background: "rgba(43, 123, 105, 0.42)",
            filter: "blur(2px)",
          }}
        />
        <Card suit="spade" color="#17242A" rotation="-10deg" />
        <Card suit="heart" color="#E35B70" rotation="8deg" />
      </div>
    ),
    size,
  );
}
