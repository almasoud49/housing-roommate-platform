import "dotenv/config";
import { connectPrisma, disconnectPrisma } from "../src/app/lib/prisma";
import { connectRedis, redisClient } from "../src/app/lib/redis";
import {
	seedAdmin,
	seedDemoData,
	seedTesterAdmin,
} from "../src/app/utils/seed";

async function runSeeders() {
	try {
		await connectPrisma();
		await connectRedis();

		await seedAdmin();
		await seedTesterAdmin();
		await seedDemoData();

		console.log("Seeders completed successfully!");
	} catch (error) {
		console.error("Error running seeders:", error);
		process.exit(1);
	} finally {
		await disconnectPrisma();
		await redisClient.quit();
		process.exit(0);
	}
}

runSeeders();
