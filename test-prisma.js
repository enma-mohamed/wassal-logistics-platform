import { PrismaClient } from "@prisma/client";

async function test() {
  // Test 1: empty constructor
  try {
    const p1 = new PrismaClient();
    await p1.$connect();
    console.log("OK: empty constructor works");
    await p1.$disconnect();
  } catch (e) {
    console.log("FAIL empty:", e.message.slice(0, 100));
  }

  // Test 2: datasources option
  try {
    const p2 = new PrismaClient({ datasources: { db: { url: "file:./prisma/dev.db" } } });
    await p2.$connect();
    console.log("OK: datasources works");
    await p2.$disconnect();
  } catch (e) {
    console.log("FAIL datasources:", e.message.slice(0, 100));
  }

  // Test 3: adapter
  try {
    const p3 = new PrismaClient({ adapter: undefined });
    await p3.$connect();
    console.log("OK: adapter works");
    await p3.$disconnect();
  } catch (e) {
    console.log("FAIL adapter:", e.message.slice(0, 200));
  }
}

test();
