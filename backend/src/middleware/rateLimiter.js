import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
});

const rateLimiter = async (req, res, next) => {
  try {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "127.0.0.1";
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
