import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Role } from "../../generated/prisma/client";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";

const seedUserByCredentials = async (options: {
	name: string | undefined;
	email: string | undefined;
	password: string | undefined;
	label: string;
}) => {
	try {
		const { name, email, password, label } = options;

		if (!name || !email || !password) {
			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				`${label} Name, Email, Password Missing In Env File!!!`,
			);
		}

		const isExist = await prisma.user.findUnique({
			where: {
				email,
			},
		});

		if (isExist) {
			console.log(`${label} Already Exists!`);
			return;
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const user = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.ADMIN,
				emailVerified: true,
			},
		});

		console.log(`${label} Created : `, user);
	} catch (error) {
		console.log(`Error Seeding ${options.label} : `, error);

		await prisma.user
			.delete({
				where: {
					email: options.email as string,
				},
			})
			.catch(() => {});
	}
};

export const seedAdmin = async () => {
	await seedUserByCredentials({
		name: config.admin_name,
		email: config.admin_email,
		password: config.admin_password,
		label: "Admin",
	});
};

export const seedTesterAdmin = async () => {
	await seedUserByCredentials({
		name: config.tester_admin_name,
		email: config.tester_admin_email,
		password: config.tester_admin_password,
		label: "Tester Admin",
	});
};

const DEMO_PASSWORD = "password123";

const ensureDemoUser = async (email: string, name: string, role: Role) => {
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		console.log(`Demo user already exists: ${email} (${existing.id})`);
		return existing;
	}

	const hashedPassword = await bcrypt.hash(
		DEMO_PASSWORD,
		Number(config.bcrypt_salt_rounds),
	);

	const user = await prisma.user.create({
		data: {
			name,
			email,
			password: hashedPassword,
			role,
			emailVerified: true,
		},
	});

	console.log(`Demo user created: ${email} (${user.id})`);
	return user;
};

export const seedDemoData = async () => {
	try {
		const landlord = await ensureDemoUser(
			"landlord@demo.com",
			"Demo Landlord",
			Role.LANDLORD,
		);
		const tenantOne = await ensureDemoUser(
			"tenant.one@demo.com",
			"Demo Tenant One",
			Role.TENANT,
		);
		const tenantTwo = await ensureDemoUser(
			"tenant.two@demo.com",
			"Demo Tenant Two",
			Role.TENANT,
		);
		const manager = await ensureDemoUser(
			"manager@gmail.com",
			"Demo Property Manager",
			Role.PROPERTY_MANAGER,
		);

		let property = await prisma.property.findFirst({
			where: { landlordId: landlord.id, title: "Green View Apartments" },
		});
		if (!property) {
			property = await prisma.property.create({
				data: {
					landlordId: landlord.id,
					title: "Green View Apartments",
					description: "Demo property for API testing",
					address: "House 12, Road 27, Dhanmondi",
					city: "Dhaka",
				},
			});
			console.log(`Demo property created: ${property.id}`);
		}

		let building = await prisma.building.findFirst({
			where: { propertyId: property.id, name: "Building A" },
		});
		if (!building) {
			building = await prisma.building.create({
				data: {
					propertyId: property.id,
					name: "Building A",
					address: "House 12, Road 27, Dhanmondi",
					city: "Dhaka",
					floors: 5,
				},
			});
			console.log(`Demo building created: ${building.id}`);
		}

		let flat = await prisma.flat.findUnique({
			where: {
				buildingId_flatNumber: { buildingId: building.id, flatNumber: "A-101" },
			},
		});
		if (!flat) {
			flat = await prisma.flat.create({
				data: { buildingId: building.id, flatNumber: "A-101", floor: 1 },
			});
			console.log(`Demo flat created: ${flat.id}`);
		}

		const ensureRoom = async (name: string, price: number) => {
			const existing = await prisma.room.findFirst({
				where: { flatId: flat.id, name },
			});
			if (existing) return existing;
			const room = await prisma.room.create({
				data: { flatId: flat.id, name, price, isActive: true },
			});
			console.log(`Demo room created: ${name} (${room.id})`);
			return room;
		};

		const roomOne = await ensureRoom("Room 1", 15000);
		const roomTwo = await ensureRoom("Room 2", 12000);

		let application = await prisma.application.findUnique({
			where: {
				tenantId_roomId: { tenantId: tenantOne.id, roomId: roomOne.id },
			},
		});
		if (!application) {
			application = await prisma.application.create({
				data: {
					tenantId: tenantOne.id,
					roomId: roomOne.id,
					status: "ACCEPTED",
					message: "Demo application",
				},
			});
			console.log(`Demo application created: ${application.id}`);
		}

		const maintenance = await prisma.maintenanceRequest.findFirst({
			where: { tenantId: tenantOne.id, roomId: roomOne.id },
		});
		if (!maintenance) {
			await prisma.maintenanceRequest.create({
				data: {
					tenantId: tenantOne.id,
					roomId: roomOne.id,
					title: "Leaking faucet in bathroom",
					description: "Water dripping continuously from the basin tap",
					category: "plumbing",
					priority: "HIGH",
				},
			});
			console.log("Demo maintenance request created");
		}

		const viewing = await prisma.propertyViewingRequest.findFirst({
			where: { tenantId: tenantTwo.id, roomId: roomTwo.id },
		});
		if (!viewing) {
			const preferredDate = new Date();
			preferredDate.setDate(preferredDate.getDate() + 7);
			await prisma.propertyViewingRequest.create({
				data: {
					tenantId: tenantTwo.id,
					roomId: roomTwo.id,
					preferredDate,
					preferredTime: "10:00 AM - 11:00 AM",
					notes: "Demo viewing request",
				},
			});
			console.log("Demo viewing request created");
		}

		const bill = await prisma.utilityBill.findFirst({
			where: { roomId: roomOne.id, type: "ELECTRICITY" },
		});
		if (!bill) {
			const dueDate = new Date();
			dueDate.setDate(dueDate.getDate() + 15);
			await prisma.utilityBill.create({
				data: {
					roomId: roomOne.id,
					type: "ELECTRICITY",
					amount: 3000,
					currency: "BDT",
					billingPeriod: new Date("2026-09-01T00:00:00.000Z"),
					dueDate,
					notes: "Demo September electricity bill",
					splits: {
						create: [
							{ tenantId: tenantOne.id, amount: 1500 },
							{ tenantId: tenantTwo.id, amount: 1500 },
						],
					},
				},
			});
			console.log("Demo utility bill created");
		}

		const document = await prisma.rentalDocument.findFirst({
			where: { applicationId: application.id, type: "LEASE_AGREEMENT" },
		});
		if (!document) {
			await prisma.rentalDocument.create({
				data: {
					applicationId: application.id,
					type: "LEASE_AGREEMENT",
					title: "Lease agreement - Flat A-101 Room 1",
					fileUrl: "https://example.com/demo-lease.pdf",
				},
			});
			console.log("Demo rental document created");
		}

		const existingNotice = await prisma.notification.findFirst({
			where: { userId: tenantOne.id, type: "SYSTEM_ANNOUNCEMENT" },
		});
		if (!existingNotice) {
			await prisma.notification.create({
				data: {
					userId: tenantOne.id,
					type: "SYSTEM_ANNOUNCEMENT",
					title: "Welcome to the demo",
					message: "Use these notifications to test the notifications API",
				},
			});
			console.log("Demo notification created");
		}

		console.log(
			`\n---- Demo credentials (password for all: ${DEMO_PASSWORD}) ----`,
		);
		console.log(`Landlord : landlord@demo.com (${landlord.id})`);
		console.log(`Tenant 1 : tenant.one@demo.com (${tenantOne.id})`);
		console.log(`Tenant 2 : tenant.two@demo.com (${tenantTwo.id})`);
		console.log(`Manager  : manager@gmail.com (${manager.id})`);
		console.log(`Room 1   : ${roomOne.id} | Room 2: ${roomTwo.id}`);
		console.log(`Application: ${application.id}`);
	} catch (error) {
		console.log("Error Seeding Demo Data : ", error);
	}
};

export const runSeeders = async () => {
	await seedAdmin();
	await seedTesterAdmin();
	await seedDemoData();
};
