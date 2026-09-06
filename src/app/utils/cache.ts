import { redisManager } from "../lib/redis";

const CACHE_PREFIX = "housing:";
const DEFAULT_TTL = 60 * 5; // 5 minutes

export interface CacheOptions {
	ttl?: number;
	prefix?: string;
}

export const buildCacheKey = (
	parts: (string | number)[],
	prefix = CACHE_PREFIX,
): string => {
	return prefix + parts.join(":");
};

export const getCache = async <T>(key: string): Promise<T | null> => {
	const data = await redisManager.get(key);
	if (!data) return null;

	try {
		return JSON.parse(data) as T;
	} catch {
		return null;
	}
};

export const setCache = async <T>(
	key: string,
	value: T,
	options: CacheOptions = {},
): Promise<void> => {
	const { ttl = DEFAULT_TTL, prefix = CACHE_PREFIX } = options;
	const fullKey = prefix + key;
	const serialized = JSON.stringify(value);

	await redisManager.set(fullKey, serialized, { EX: ttl });
};

export const deleteCache = async (
	key: string,
	prefix = CACHE_PREFIX,
): Promise<void> => {
	await redisManager.del(prefix + key);
};

export const deleteCachePattern = async (
	pattern: string,
	prefix = CACHE_PREFIX,
): Promise<number> => {
	const keys = await redisManager.keys(prefix + pattern);
	if (keys.length > 0) {
		await redisManager.del(keys);
	}
	return keys.length;
};

export const invalidateUserCache = async (userId: string): Promise<void> => {
	await Promise.all([
		deleteCachePattern(`user:${userId}:*`),
		deleteCachePattern(`profile:${userId}:*`),
		deleteCachePattern(`application:user:${userId}:*`),
		deleteCachePattern(`notification:${userId}:*`),
	]);
};

export const invalidatePropertyCache = async (
	propertyId: string,
): Promise<void> => {
	await Promise.all([
		deleteCachePattern(`property:${propertyId}:*`),
		deleteCachePattern(`property:list:*`),
		deleteCachePattern(`room:property:${propertyId}:*`),
	]);
};

export const invalidateRoomCache = async (roomId: string): Promise<void> => {
	await Promise.all([
		deleteCachePattern(`room:${roomId}:*`),
		deleteCachePattern(`room:list:*`),
		deleteCachePattern(`application:room:${roomId}:*`),
	]);
};

export const invalidateApplicationCache = async (
	applicationId: string,
	userId?: string,
): Promise<void> => {
	const promises = [
		deleteCachePattern(`application:${applicationId}:*`),
		deleteCachePattern(`application:list:*`),
	];

	if (userId) {
		promises.push(deleteCachePattern(`application:user:${userId}:*`));
	}

	await Promise.all(promises);
};

export const invalidateRentCache = async (
	roomId: string,
	tenantId?: string,
): Promise<void> => {
	const promises = [
		deleteCachePattern(`rent:room:${roomId}:*`),
		deleteCachePattern(`rent:list:*`),
	];

	if (tenantId) {
		promises.push(deleteCachePattern(`rent:user:${tenantId}:*`));
	}

	await Promise.all(promises);
};

export const invalidateMaintenanceCache = async (
	roomId: string,
): Promise<void> => {
	await Promise.all([
		deleteCachePattern(`maintenance:room:${roomId}:*`),
		deleteCachePattern(`maintenance:list:*`),
	]);
};

export const invalidateUtilityBillCache = async (
	roomId: string,
): Promise<void> => {
	await Promise.all([
		deleteCachePattern(`utility:room:${roomId}:*`),
		deleteCachePattern(`utility:list:*`),
	]);
};

export const invalidateViewingRequestCache = async (
	roomId: string,
	userId?: string,
): Promise<void> => {
	const promises = [
		deleteCachePattern(`viewing:room:${roomId}:*`),
		deleteCachePattern(`viewing:list:*`),
	];

	if (userId) {
		promises.push(deleteCachePattern(`viewing:user:${userId}:*`));
	}

	await Promise.all(promises);
};

export const invalidateReviewCache = async (userId: string): Promise<void> => {
	await Promise.all([
		deleteCachePattern(`review:user:${userId}:*`),
		deleteCachePattern(`review:list:*`),
	]);
};

export const invalidateRoommateCache = async (
	userId: string,
): Promise<void> => {
	await Promise.all([
		deleteCachePattern(`roommate:${userId}:*`),
		deleteCachePattern(`roommate:matches:${userId}:*`),
		deleteCachePattern(`roommate:preferences:${userId}:*`),
	]);
};

export const invalidateAllUserCaches = async (): Promise<void> => {
	await deleteCachePattern("*");
};

export const warmCache = async <T>(
	key: string,
	fetcher: () => Promise<T>,
	options: CacheOptions = {},
): Promise<T> => {
	const cached = await getCache<T>(key);
	if (cached !== null) return cached;

	const fresh = await fetcher();
	await setCache(key, fresh, options);
	return fresh;
};

export const getOrSetCache = async <T>(
	key: string,
	fetcher: () => Promise<T>,
	options: CacheOptions = {},
): Promise<T> => {
	return warmCache(key, fetcher, options);
};
