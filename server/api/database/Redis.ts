import { ClientClosedError, createClient } from 'redis';

const dbUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({ url: dbUrl });
redisClient.on('error', (err) => console.log('🚨 Redis Client Error:', err));

let isConnected = false;

const connectRedis = async () => {
  if (isConnected || (await checkRedisHealth())) {
    return;
  }
  try {
    await redisClient.connect();
    isConnected = true;
    console.info(`✅ Successfully connected to redis!`);
  } catch (error) {
    console.error('🚨 Error connecting to redis:', error);
    process.exit(1);
  }
};

redisClient.on('disconnected', () => {
  console.warn('❌ Redis disconnected.');
  isConnected = false;
});

const setValue = async (key: string, value: string): Promise<void> => {
  if (await checkRedisHealth()) {
    await redisClient.set(key, value);
  }
};

const getValue = async (key: string): Promise<string | null> => {
  if (await checkRedisHealth()) {
    return redisClient.get(key);
  }
  return null;
};

const removeValue = async (key: string): Promise<void> => {
  if (await checkRedisHealth()) {
    await redisClient.del(key);
  }
};

const checkRedisHealth = async (): Promise<boolean> => {
  try {
    await redisClient.set('health', 'ok');
    const reply = await redisClient.get('health');
    return reply === 'ok';
  } catch (error) {
    if (!(error instanceof ClientClosedError)) {
      console.error('❤️‍🩹❌ Redis health check failed:', error);
    }
    return false;
  }
};

export { connectRedis, checkRedisHealth, setValue, getValue, removeValue };
