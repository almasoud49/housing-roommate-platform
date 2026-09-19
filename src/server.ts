import app from "./app";
import config from "./app/config";
import { transporter } from "./app/lib/nodemailer";
import { connectPrisma, prisma } from "./app/lib/prisma";
import { connectRedis, redisClient } from "./app/lib/redis";

const PORT = config.port || 5000;

const main = async () => {
	try {
		await connectPrisma();
		console.log(
			"Connected to the housing & roommate platform database successfully.",
		);

		await connectRedis();
		console.log("Redis Connected Successfully.");

		try {
			await transporter.verify();
			console.log("Nodemailer Connected Successfully.");
		} catch {
			console.warn("Nodemailer not configured. Email features disabled.");
		}

		app.listen(PORT, () => {
			console.log(
				`Housing & Roommate Platform Server is running on port ${PORT}`,
			);
		});
	} catch (error) {
		console.error("Error starting the server:", error);
		await prisma.$disconnect();
		await redisClient.quit();
		process.exit(1);
	}
};

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { app };
export default app;
