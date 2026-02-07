import NodeCache from 'node-cache';

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

export const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.userId}_${req.originalUrl}`;
    const cachedData = cache.get(key);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original send
    const originalSend = res.json.bind(res);

    // Override send
    res.json = (data) => {
      cache.set(key, data, duration || 300);
      originalSend(data);
    };

    next();
  };
};

// Clear user cache
export const clearUserCache = (userId) => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.startsWith(userId)) {
      cache.del(key);
    }
  });
};