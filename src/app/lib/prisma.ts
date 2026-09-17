import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../../generated/prisma/client";
import config from "../config";

const pool = new Pool({
	connectionString: config.database_url,
	max: 5,
	idleTimeoutMillis: 20000,
	connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
	adapter,
	log:
		config.node_env === "development" ? ["query", "error", "warn"] : ["error"],
});

let isConnected = false;
let connectPromise: Promise<void> | null = null;

export const connectPrisma = async (): Promise<void> => {
	if (isConnected) return;
	if (!connectPromise) {
		connectPromise = prisma
			.$connect()
			.then(() => {
				isConnected = true;
			})
			.finally(() => {
				connectPromise = null;
			});
	}
	await connectPromise;
};

export const disconnectPrisma = async (): Promise<void> => {
	if (isConnected) {
		await prisma.$disconnect();
		isConnected = false;
	}
};

export const getPrismaStatus = (): boolean => isConnected;

export { prisma };
