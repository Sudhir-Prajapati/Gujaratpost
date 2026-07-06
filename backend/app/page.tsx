export default function Page() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontFamily: "sans-serif",
      backgroundColor: "#111",
      color: "#fff"
    }}>
      <h1>Gujarat Post Backend API Server</h1>
      <p style={{ color: "#888" }}>Port 5000 - Running</p>
    </div>
  );
}
