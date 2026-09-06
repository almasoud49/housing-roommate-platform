import app from "./app";
import config from "./app/config";
import { transporter } from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import { seedAdmin, seedTesterAdmin } from "./app/utils/seed";

const PORT = config.port;

const main = async () => {
	try {
		await prisma.$connect();
		console.log(
			"Connected to the housing & roommate platform database successfully.",
		);

		await redisClient.connect();
		console.log("Redis Connected Successfully.");

		await transporter.verify();
		console.log("Nodemailer Connected Successfully.");

		await seedAdmin();
		await seedTesterAdmin();

		app.listen(PORT, () => {
			console.log(
				`Housing & Roommate Platform Server is running on port ${PORT}`,
			);
		});
	} catch (error) {
		console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
};

main();
