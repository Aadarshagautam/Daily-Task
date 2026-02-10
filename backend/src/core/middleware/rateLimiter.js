import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
});

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "127.0.0.1";
};

const rateLimiter = async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return res
        .status(429)
        .json({ success: false, message: "Too many requests, please try again later." });
    }

    next();
  } catch (error) {
    console.error("Rate Limiter Error:", error);
    next();
  }
};

export default rateLimiter;
