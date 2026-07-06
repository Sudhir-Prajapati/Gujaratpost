import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find category Ahmedabad
  const category = await prisma.category.findFirst({
    where: { name: "Ahmedabad" }
  });

  // Find author Kajal Rani
  const author = await prisma.author.findFirst({
    where: { name: "Kajal Rani" }
  });

  // Find user Reporter
  const user = await prisma.user.findFirst({
    where: { email: "Reporter@gujaratpost.com" }
  });

  console.log("Category ID:", category?.id);
  console.log("Author ID:", author?.id);
  console.log("User ID:", user?.id);

  if (!category || !author || !user) {
    throw new Error("Missing database records for test.");
  }

  // Attempt to create the article
  try {
    const article = await prisma.article.create({
      data: {
        slug: "test-monsoon-rains-ahmedabad-floods",
        title: "Monsoon Rains Ahmedabad Floods",
        titleGu: "Monsoon Rains Ahmedabad Floods",
        titleHi: "Monsoon Rains Ahmedabad Floods",
        excerpt: "Monsoon Rains Ahmedabad Floods",
        excerptGu: "Monsoon Rains Ahmedabad Floods",
        excerptHi: "Monsoon Rains Ahmedabad Floods",
        content: "Monsoon Rains Ahmedabad Floods",
        contentGu: "Monsoon Rains Ahmedabad Floods",
        contentHi: "Monsoon Rains Ahmedabad Floods",
        featuredImage: "https://images.openai.com/static-rsc-4/s_QTReEFFXt50mFY5oVUchNooliMm7zZa3mR6NQ1RxGY3fZXzOp6ijzWxK0XMXr8Ps-",
        thumbnail: "https://images.openai.com/static-rsc-4/s_QTReEFFXt50mFY5oVUchNooliMm7zZa3mR6NQ1RxGY3fZXzOp6ijzWxK0XMXr8Ps-",
        category: { connect: { id: category.id } },
        author: { connect: { id: author.id } },
        readingTime: 3,
        isTrending: false,
        isBreaking: false,
        isFeatured: false,
        isPublished: false,
        priority: 0,
        status: "DRAFT",
        createdByUser: { connect: { id: user.id } },
      }
    });

    console.log("Article created successfully:", article.id);
  } catch (err) {
    console.error("Prisma error details:", err);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
