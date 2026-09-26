import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const menu = [
  {
    name: "Jollof Rice",
    slug: "jollof-rice",
    description: "Classic Ghanaian jollof with sides — hearty and ready for delivery.",
    category: "Rice",
    sortOrder: 1,
  },
  {
    name: "Fufu and Soup",
    slug: "fufu-and-soup",
    description: "Soft fufu served with rich traditional soup.",
    category: "Swallow",
    sortOrder: 2,
  },
  {
    name: "Banku and Soup",
    slug: "banku-and-soup",
    description: "Fresh banku with savory soup — a local favourite.",
    category: "Swallow",
    sortOrder: 3,
  },
  {
    name: "Grilled Chicken",
    slug: "grilled-chicken",
    description: "Seasoned grilled chicken, perfect for sharing or a solo feast.",
    category: "Grill",
    sortOrder: 4,
  },
] as const;

async function main() {
  await prisma.restaurantSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      name: "Rubies Cuisine",
      tagline: "Are you hungry? Don't wait!",
      phones: ["0277491795", "0593933901"],
      whatsapp: "233277491795",
      address: "Amamorley Canada Junction, off the Pokuase–Ablekuma Highway",
      deliveryFeeMode: "fixed",
      fixedDeliveryFeeGhs: 10,
      closedWeekdays: [3],
      ownerEmails: [],
      ownerPhones: ["0277491795"],
    },
    update: {
      name: "Rubies Cuisine",
      tagline: "Are you hungry? Don't wait!",
      phones: ["0277491795", "0593933901"],
      whatsapp: "233277491795",
      address: "Amamorley Canada Junction, off the Pokuase–Ablekuma Highway",
      closedWeekdays: [3],
    },
  });

  for (const item of menu) {
    await prisma.menuItem.upsert({
      where: { slug: item.slug },
      create: {
        ...item,
        priceGhs: 45,
        available: true,
        imageUrl: null,
      },
      update: {
        name: item.name,
        description: item.description,
        priceGhs: 45,
        category: item.category,
        sortOrder: item.sortOrder,
        available: true,
      },
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@rubiescuisine.local";
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Rubies Admin",
      role: "admin",
      isGuest: false,
      // Password hashing lands in Phase 2 — placeholder hash of "changeme"
      passwordHash: "$pending$",
    },
    update: {
      role: "admin",
    },
  });

  console.log("Seed complete: restaurant settings, 4 menu items @ GHS 45, admin user");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
