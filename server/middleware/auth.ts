import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// 从环境变量或使用默认值
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    realName: string;
    role: string;
    department: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    console.log("🔐 认证请求头:", authHeader);

    const token = authHeader && authHeader.split(" ")[1];
    console.log(
      "🔑 提取的token:",
      token ? `${token.substring(0, 20)}...` : "无"
    );

    if (!token) {
      console.log("❌ 访问令牌缺失");
      return res.status(401).json({ error: "访问令牌缺失" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log("✅ JWT验证成功，用户ID:", decoded.userId);

      // 使用JWT中解码的用户信息
      req.user = {
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        realName: decoded.realName,
        role: decoded.role,
        department: decoded.department,
      };

      next();
    } catch (jwtError: any) {
      console.error("❌ JWT验证失败:", jwtError.message);
      console.error("JWT错误类型:", jwtError.name);
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({ error: "访问令牌已过期" });
      } else if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "无效的访问令牌" });
      } else {
        return res.status(401).json({ error: "令牌验证失败" });
      }
    }
  } catch (error: any) {
    console.error("❌ 认证中间件异常:", error);
    return res.status(500).json({ error: "认证服务异常" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "未认证" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "权限不足" });
    }

    next();
  };
};
