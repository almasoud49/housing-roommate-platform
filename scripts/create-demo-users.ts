import bcrypt from "bcryptjs";
import { prisma } from "../src/app/lib/prisma";

const users = [
  { name: "Demo Tenant", email: "demo.tenant@housing.com", password: "Demo@12345", role: "TENANT" as const },
  { name: "Demo Landlord", email: "demo.landlord@housing.com", password: "Demo@12345", role: "LANDLORD" as const },
  { name: "Demo Manager", email: "demo.manager@housing.com", password: "Demo@12345", role: "PROPERTY_MANAGER" as const },
];

async function main() {
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) { console.log(u.email, "exists"); continue; }
    const hashed = await bcrypt.hash(u.password, 10);
    await prisma.user.create({ data: { ...u, password: hashed, emailVerified: true, status: "ACTIVE" } });
    console.log("created", u.email);
  }
  await prisma.$disconnect();
}
main();
