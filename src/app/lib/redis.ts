import { createClient, type RedisClientType } from "redis";
import config from "../config";

export const redisClient: RedisClientType = createClient({
	username: config.redis_user,
	password: config.redis_password,
	socket: {
		host: config.redis_host,
		port: Number(config.redis_port),
		connectTimeout: 10000,
	},
});

redisClient.on("error", (err) => {
	console.error("Redis Client Error:", err);
});

// Guards concurrent connect() calls: without it, parallel requests race
// into "Socket already opened" crashes (node-redis has no internal lock).
let connectPromise: Promise<void> | null = null;

export const connectRedis = async (): Promise<void> => {
	if (redisClient.isOpen) return;
	if (!connectPromise) {
		connectPromise = redisClient
			.connect()
			.then(() => undefined)
			.finally(() => {
				connectPromise = null;
			});
	}
	await connectPromise;
};

export const disconnectRedis = async (): Promise<void> => {
	if (redisClient.isOpen) {
		await redisClient.quit();
	}
};

export const getRedisStatus = (): string => {
	if (redisClient.isReady) return "ready";
	if (redisClient.isOpen) return "connecting";
	return "closed";
};

export const redisManager = {
	get: async (key: string): Promise<string | null> => {
		await connectRedis();
		return redisClient.get(key);
	},
	set: async (
		key: string,
		value: string,
		options?: { EX?: number },
	): Promise<void> => {
		await connectRedis();
		if (options?.EX) {
			await redisClient.set(key, value, { EX: options.EX });
		} else {
			await redisClient.set(key, value);
		}
	},
	del: async (keys: string | string[]): Promise<void> => {
		await connectRedis();
		await redisClient.del(keys);
	},
	keys: async (pattern: string): Promise<string[]> => {
		await connectRedis();
		return redisClient.keys(pattern);
	},
	ttl: async (key: string): Promise<number> => {
		await connectRedis();
		return redisClient.ttl(key);
	},
};
