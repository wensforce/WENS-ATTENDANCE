import app from "./src/app.js";
import prisma from "./lib/prisma.js";

async function main() {
  try {
    await prisma.$connect();
    console.log("Prisma connected to the database");
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  } catch (error) {
    console.error("Prisma connection error:", error);
    process.exit(1);
  }
}

main();