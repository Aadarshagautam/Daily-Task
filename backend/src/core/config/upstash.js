import {Ratelimit} from '@upstash/ratelimit';
import {Redis} from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();


const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, "20s"),
  }); // 200 requests per 20 seconds
  
  export default async function rateLimitMiddleware(req, res, next) {
    try {
      const ip = req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "127.0.0.1";
      const { success } = await ratelimit.limit(ip);
  
      if (!success) {
        return res.status(429).json({
          message: "Too many requests, please try again later",
        });
      }
  
      next();
    } catch (error) {
      console.log("Rate limiter error:", error.message);
      next(error);
    }
  }
  
