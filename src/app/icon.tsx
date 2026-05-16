import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
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
        top: suit === "spade" ? 12 : 6,
        left: suit === "spade" ? 8 : 24,
        width: 28,
        height: 40,
        borderRadius: 6,
        background: "#fffdf9",
        border: "2px solid rgba(214, 199, 178, 0.9)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "4px 5px",
        transform: `rotate(${rotation})`,
        boxShadow:
          suit === "spade"
            ? "0 4px 12px rgba(0, 0, 0, 0.28)"
            : "0 8px 18px rgba(0, 0, 0, 0.34)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          color,
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        <div>A</div>
        <div style={{ fontSize: 9 }}>{suit === "spade" ? "♠" : "♥"}</div>
      </div>
      <div
        style={{
          alignSelf: "center",
          color,
          fontSize: suit === "spade" ? 16 : 15,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {suit === "spade" ? "♠" : "♥"}
      </div>
    </div>
  );
}

export default function Icon() {
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
          borderRadius: 16,
          overflow: "hidden",
          background:
            "radial-gradient(circle at top, rgba(51, 132, 110, 0.28), transparent 54%), linear-gradient(180deg, #091419 0%, #071116 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 10,
            width: 40,
            height: 6,
            borderRadius: 999,
            background: "rgba(43, 123, 105, 0.42)",
            filter: "blur(1px)",
          }}
        />
        <Card suit="spade" color="#17242A" rotation="-10deg" />
        <Card suit="heart" color="#E35B70" rotation="8deg" />
      </div>
    ),
    size,
  );
}
