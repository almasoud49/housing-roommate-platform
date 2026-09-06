import { prisma } from "../lib/prisma";
import { redisManager } from "../lib/redis";

interface QueryMetrics {
	query: string;
	duration: number;
	timestamp: Date;
	params?: unknown;
}

const queryMetrics: QueryMetrics[] = [];
const MAX_METRICS = 1000;

export const recordQueryMetric = (
	query: string,
	duration: number,
	params?: unknown,
) => {
	queryMetrics.push({
		query,
		duration,
		timestamp: new Date(),
		params,
	});

	if (queryMetrics.length > MAX_METRICS) {
		queryMetrics.shift();
	}
};

export const getSlowQueries = (threshold = 100): QueryMetrics[] => {
	return queryMetrics
		.filter((m) => m.duration > threshold)
		.sort((a, b) => b.duration - a.duration);
};

export const getQueryStats = () => {
	if (queryMetrics.length === 0) return null;

	const durations = queryMetrics.map((m) => m.duration);
	const total = durations.reduce((a, b) => a + b, 0);

	return {
		totalQueries: queryMetrics.length,
		avgDuration: total / queryMetrics.length,
		minDuration: Math.min(...durations),
		maxDuration: Math.max(...durations),
		slowQueries: queryMetrics.filter((m) => m.duration > 100).length,
	};
};

export const clearQueryMetrics = () => {
	queryMetrics.length = 0;
};

export const withQueryTiming = async <T>(
	operation: () => Promise<T>,
	queryName: string,
): Promise<T> => {
	const start = Date.now();
	try {
		const result = await operation();
		const duration = Date.now() - start;
		recordQueryMetric(queryName, duration);
		return result;
	} catch (error) {
		const duration = Date.now() - start;
		recordQueryMetric(`${queryName} (ERROR)`, duration);
		throw error;
	}
};

export const executeWithRetry = async <T>(
	operation: () => Promise<T>,
	maxRetries = 3,
	baseDelay = 100,
): Promise<T> => {
	let lastError: Error;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error as Error;

			if (attempt === maxRetries) {
				throw error;
			}

			const delay = baseDelay * 2 ** attempt;
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError!;
};

export const batchQueries = async <T, R>(
	items: T[],
	batchSize: number,
	operation: (batch: T[]) => Promise<R[]>,
): Promise<R[]> => {
	const results: R[] = [];

	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		const batchResults = await operation(batch);
		results.push(...batchResults);
	}

	return results;
};

export const createCursorPaginator = <T>(
	fetchPage: (
		cursor: string | null,
		limit: number,
	) => Promise<{ data: T[]; nextCursor: string | null }>,
	limit = 20,
) => {
	let cursor: string | null = null;
	let hasMore = true;

	return {
		async next(): Promise<{ data: T[]; hasMore: boolean }> {
			if (!hasMore) return { data: [], hasMore: false };

			const { data, nextCursor } = await fetchPage(cursor, limit);
			cursor = nextCursor;
			hasMore = !!nextCursor;

			return { data, hasMore };
		},
		reset() {
			cursor = null;
			hasMore = true;
		},
	};
};

export const preloadRelations = async <T extends { id: string }>(
	ids: string[],
	fetchFn: (ids: string[]) => Promise<T[]>,
): Promise<Map<string, T>> => {
	const results = await fetchFn(ids);
	const map = new Map<string, T>();

	for (const item of results) {
		map.set(item.id, item);
	}

	return map;
};

export const chunkedFindMany = async <T>(
	model: {
		findMany: (args: { where: { id: { in: string[] } } }) => Promise<T[]>;
	},
	ids: string[],
	chunkSize = 100,
): Promise<T[]> => {
	const results: T[] = [];

	for (let i = 0; i < ids.length; i += chunkSize) {
		const chunk = ids.slice(i, i + chunkSize);
		const chunkResults = await model.findMany({
			where: { id: { in: chunk } },
		});
		results.push(...chunkResults);
	}

	return results;
};
