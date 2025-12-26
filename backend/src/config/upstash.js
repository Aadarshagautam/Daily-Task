import {Ratelimit} from '@upstash/ratelimit';
import {Redis} from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();


const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60s"),
  });
  
  export default async function rateLimitMiddleware(req, res, next) {
    try {
      const ip = req.ip ?? "anonymous";
      const { success } = await ratelimit.limit(ip);
  
      if (!success) {
        return res.status(429).json({
          message: "Too many requests, please try again later",
        });
      }
  
      next();
    } catch (error) {
      next(error);
    }
  }
  
