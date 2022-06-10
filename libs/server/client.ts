import { PrismaClient } from "@prisma/client";

declare global {
  var client: PrismaClient;
}
// Avoid instantiating too many instances of Prisma in development
// https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices#problem
if (process.env.NODE_ENV === "production") {
  client = new PrismaClient();
} else {
  if (!global.client) {
    global.client = new PrismaClient();
  }
  client = global.client;
}

export default client;
