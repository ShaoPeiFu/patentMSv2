import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
    version: "1.0.0",
  });
});

const port = 3002;
app.listen(port, () => {
  console.log(`🚀 测试服务器运行在 http://localhost:${port}`);
  console.log(`📊 健康检查: http://localhost:${port}/api/health`);
});
