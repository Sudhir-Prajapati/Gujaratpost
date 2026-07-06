import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    }
  });

  console.log("Existing Articles count:", articles.length);
  console.log(JSON.stringify(articles, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
