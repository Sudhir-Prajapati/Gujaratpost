import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      author: true
    }
  });

  console.log("USERS:");
  console.log(JSON.stringify(users, null, 2));

  const articlesCount = await prisma.article.count();
  console.log("Total articles in database:", articlesCount);

  // Group by status
  const statusCounts = await prisma.article.groupBy({
    by: ['status'],
    _count: {
      _all: true
    }
  });
  console.log("Articles by status:", JSON.stringify(statusCounts, null, 2));

  // Let's count articles by author
  const authorCounts = await prisma.article.groupBy({
    by: ['authorId'],
    _count: {
      _all: true
    }
  });
  console.log("Articles by authorId:", JSON.stringify(authorCounts, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
