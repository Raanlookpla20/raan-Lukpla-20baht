import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "เครื่องครัวพลาสติก", slug: "kitchen-plastic" },
  { name: "เครื่องเขียน", slug: "stationery" },
  { name: "เครื่องมือช่าง", slug: "tools" },
  { name: "อุปกรณ์ทำความสะอาด", slug: "cleaning" },
  { name: "ของเล่น", slug: "toys" },
  { name: "รองเท้า", slug: "shoes" },
  { name: "กิ๊ฟช็อป", slug: "gift-shop" },
  { name: "สินค้าเบ็ดเตล็ด", slug: "misc" },
  { name: "อุปกรณ์ IT", slug: "it-accessories" },
  { name: "กระเป๋า", slug: "bags" },
];

const PLACEHOLDER_IMG = "/images/product-placeholder.svg";

interface SeedOptionGroup {
  name: string;
  values: { label: string; priceDelta?: number; stock: number }[];
}

interface SeedProduct {
  name: string;
  slug: string;
  categorySlug: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  description: string;
  optionGroups?: SeedOptionGroup[];
  imageCount?: number;
}

const PRODUCTS: SeedProduct[] = [
  {
    name: "กะละมังพลาสติกอเนกประสงค์ 10 นิ้ว",
    slug: "basin-plastic-10in",
    categorySlug: "kitchen-plastic",
    price: 35,
    stock: 120,
    description: "กะละมังพลาสติกเกรดอย่างดี ทนทาน ใช้ล้างผัก ผลไม้ หรือซักผ้าได้ ขนาด 10 นิ้ว",
    optionGroups: [
      {
        name: "สี",
        values: [
          { label: "แดง", stock: 40 },
          { label: "ฟ้า", stock: 40 },
          { label: "เขียว", stock: 40 },
        ],
      },
    ],
    imageCount: 2,
  },
  {
    name: "ถังเก็บของพลาสติกมีฝาปิด 20 ลิตร",
    slug: "storage-box-20l",
    categorySlug: "kitchen-plastic",
    price: 149,
    compareAtPrice: 189,
    stock: 45,
    description: "ถังเก็บของอเนกประสงค์ พร้อมฝาปิดล็อคแน่นหนา กันฝุ่นกันน้ำ ความจุ 20 ลิตร",
    imageCount: 3,
  },
  {
    name: "ชุดช้อนส้อมพลาสติก 6 ชิ้น",
    slug: "spoon-fork-set-6pcs",
    categorySlug: "kitchen-plastic",
    price: 45,
    stock: 3,
    description: "ชุดช้อนส้อมพลาสติกคุณภาพดี ปลอดสาร BPA เซ็ตละ 6 ชิ้น",
    imageCount: 1,
  },
  {
    name: "ปากกาลูกลื่นแพ็ค 12 ด้าม",
    slug: "ballpoint-pen-12pack",
    categorySlug: "stationery",
    price: 60,
    compareAtPrice: 79,
    stock: 200,
    description: "ปากกาลูกลื่นหมึกน้ำเงิน เขียนลื่น ไม่มีสะดุด แพ็ค 12 ด้าม",
    optionGroups: [
      {
        name: "สีหมึก",
        values: [
          { label: "น้ำเงิน", stock: 100 },
          { label: "ดำ", stock: 100 },
          { label: "แดง", priceDelta: 5, stock: 40 },
        ],
      },
    ],
    imageCount: 2,
  },
  {
    name: "สมุดโน้ตปกแข็ง A5",
    slug: "notebook-a5-hardcover",
    categorySlug: "stationery",
    price: 55,
    stock: 80,
    description: "สมุดโน้ตปกแข็งเนื้อกระดาษหนา 100 แผ่น เหมาะสำหรับจดงานหรือเรียน",
    imageCount: 2,
  },
  {
    name: "ยางลบ + ไม้บรรทัด เซ็ตนักเรียน",
    slug: "eraser-ruler-set",
    categorySlug: "stationery",
    price: 25,
    stock: 0,
    description: "เซ็ตอุปกรณ์การเรียนพื้นฐาน ยางลบ 1 ชิ้น ไม้บรรทัด 15 ซม. 1 อัน",
    imageCount: 1,
  },
  {
    name: "ไขควงชุด 6 หัวพร้อมกล่อง",
    slug: "screwdriver-set-6pcs",
    categorySlug: "tools",
    price: 129,
    stock: 60,
    description: "ชุดไขควงอเนกประสงค์ 6 หัว ด้ามจับกระชับมือ พร้อมกล่องเก็บ",
    imageCount: 3,
  },
  {
    name: "เทปพันสายไฟ (ม้วน)",
    slug: "electrical-tape-roll",
    categorySlug: "tools",
    price: 15,
    stock: 300,
    description: "เทปพันสายไฟกันน้ำ ยืดหยุ่นสูง ทนความร้อน",
    optionGroups: [
      {
        name: "สี",
        values: [
          { label: "ดำ", stock: 150 },
          { label: "แดง", stock: 80 },
          { label: "เหลือง", stock: 70 },
        ],
      },
    ],
    imageCount: 1,
  },
  {
    name: "ค้อนอเนกประสงค์ด้ามไม้",
    slug: "hammer-wooden-handle",
    categorySlug: "tools",
    price: 89,
    stock: 4,
    description: "ค้อนด้ามไม้แข็งแรง หัวเหล็กกล้าชุบแข็ง เหมาะกับงานซ่อมแซมทั่วไป",
    imageCount: 2,
  },
  {
    name: "น้ำยาล้างจาน สูตรมะนาว 800 มล.",
    slug: "dish-soap-lemon-800ml",
    categorySlug: "cleaning",
    price: 32,
    stock: 150,
    description: "น้ำยาล้างจานสูตรมะนาว ขจัดคราบมันได้ดี อ่อนโยนต่อมือ ขนาด 800 มล.",
    imageCount: 2,
  },
  {
    name: "ไม้ถูพื้นไมโครไฟเบอร์",
    slug: "microfiber-mop",
    categorySlug: "cleaning",
    price: 179,
    compareAtPrice: 220,
    stock: 35,
    description: "ไม้ถูพื้นหัวไมโครไฟเบอร์ ดูดซับน้ำดี ด้ามปรับความยาวได้",
    imageCount: 2,
  },
  {
    name: "ถุงมือยางอเนกประสงค์",
    slug: "rubber-gloves",
    categorySlug: "cleaning",
    price: 28,
    stock: 90,
    description: "ถุงมือยางกันลื่น หนาทนทาน เหมาะกับงานล้างจานหรือทำความสะอาด",
    optionGroups: [
      {
        name: "ไซซ์",
        values: [
          { label: "S", stock: 30 },
          { label: "M", stock: 40 },
          { label: "L", stock: 20 },
        ],
      },
    ],
    imageCount: 1,
  },
  {
    name: "หุ่นยนต์ของเล่นบังคับวิทยุ",
    slug: "rc-robot-toy",
    categorySlug: "toys",
    price: 259,
    compareAtPrice: 329,
    stock: 18,
    description: "หุ่นยนต์ของเล่นบังคับวิทยุ เดินได้ ไฟกระพริบ เสียงเอฟเฟกต์ เหมาะกับเด็ก 6 ปีขึ้นไป",
    imageCount: 3,
  },
  {
    name: "ตุ๊กตาหมีนุ่มนิ่ม ไซซ์กลาง",
    slug: "teddy-bear-medium",
    categorySlug: "toys",
    price: 99,
    stock: 50,
    description: "ตุ๊กตาหมีขนนุ่ม หอมกรุ่น เหมาะเป็นของขวัญหรือของสะสม",
    optionGroups: [
      {
        name: "สี",
        values: [
          { label: "น้ำตาล", stock: 25 },
          { label: "ครีม", stock: 25 },
        ],
      },
    ],
    imageCount: 2,
  },
  {
    name: "ลูกบอลชายหาดเป่าลม",
    slug: "beach-ball-inflatable",
    categorySlug: "toys",
    price: 49,
    stock: 2,
    description: "ลูกบอลชายหาดเป่าลม สีสันสดใส เล่นได้ทั้งเด็กและผู้ใหญ่",
    imageCount: 1,
  },
  {
    name: "รองเท้าแตะยางอย่างหนา",
    slug: "rubber-slippers",
    categorySlug: "shoes",
    price: 79,
    stock: 65,
    description: "รองเท้าแตะยางเนื้อหนานุ่ม ใส่สบาย ทนทาน กันลื่น",
    optionGroups: [
      {
        name: "ไซซ์",
        values: [
          { label: "38", stock: 15 },
          { label: "39", stock: 15 },
          { label: "40", stock: 15 },
          { label: "41", stock: 20 },
        ],
      },
      {
        name: "สี",
        values: [
          { label: "ดำ", stock: 35 },
          { label: "น้ำตาล", stock: 30 },
        ],
      },
    ],
    imageCount: 2,
  },
  {
    name: "รองเท้าผ้าใบลำลอง",
    slug: "casual-canvas-shoes",
    categorySlug: "shoes",
    price: 259,
    compareAtPrice: 299,
    stock: 40,
    description: "รองเท้าผ้าใบลำลองใส่สบาย เหมาะกับกิจกรรมประจำวัน",
    optionGroups: [
      {
        name: "ไซซ์",
        values: [
          { label: "40", stock: 10 },
          { label: "41", stock: 10 },
          { label: "42", stock: 10 },
          { label: "43", stock: 10 },
        ],
      },
    ],
    imageCount: 3,
  },
  {
    name: "พวงกุญแจโลหะสกรีนลาย",
    slug: "metal-keychain",
    categorySlug: "gift-shop",
    price: 39,
    stock: 100,
    description: "พวงกุญแจโลหะคุณภาพดี ลวดลายน่ารัก เหมาะเป็นของฝากของที่ระลึก",
    imageCount: 2,
  },
  {
    name: "แก้วมัค เซรามิกลายการ์ตูน",
    slug: "ceramic-mug-cartoon",
    categorySlug: "gift-shop",
    price: 89,
    stock: 55,
    description: "แก้วมัคเซรามิกคุณภาพดี ลายการ์ตูนน่ารัก จุ 350 มล.",
    imageCount: 2,
  },
  {
    name: "ไฟแช็กพกพา แพ็ค 3 อัน",
    slug: "lighter-3pack",
    categorySlug: "misc",
    price: 49,
    stock: 70,
    description: "ไฟแช็กแก๊สพกพา ใช้งานสะดวก แพ็คละ 3 อัน",
    imageCount: 1,
  },
  {
    name: "ร่มพับกันแดดกันฝน",
    slug: "folding-umbrella",
    categorySlug: "misc",
    price: 129,
    compareAtPrice: 159,
    stock: 30,
    description: "ร่มพับ 3 ตอน กันแดดกันฝน พกพาสะดวก น้ำหนักเบา",
    optionGroups: [
      {
        name: "สี",
        values: [
          { label: "ดำ", stock: 15 },
          { label: "กรมท่า", stock: 15 },
        ],
      },
    ],
    imageCount: 2,
  },
  {
    name: "สายชาร์จ USB-C ยาว 1 เมตร",
    slug: "usb-c-cable-1m",
    categorySlug: "it-accessories",
    price: 59,
    stock: 8,
    description: "สายชาร์จ USB-C ทนทาน ชาร์จไฟเร็ว ยาว 1 เมตร",
    imageCount: 1,
  },
  {
    name: "เพาเวอร์แบงค์ 10000 mAh",
    slug: "powerbank-10000mah",
    categorySlug: "it-accessories",
    price: 349,
    compareAtPrice: 450,
    stock: 25,
    description: "เพาเวอร์แบงค์ความจุ 10000 mAh ชาร์จเร็ว พกพาสะดวก",
    imageCount: 3,
  },
  {
    name: "หูฟังบลูทูธไร้สาย",
    slug: "wireless-bluetooth-earbuds",
    categorySlug: "it-accessories",
    price: 199,
    stock: 33,
    description: "หูฟังบลูทูธไร้สาย เสียงคมชัด แบตอึด เชื่อมต่อง่าย",
    optionGroups: [
      {
        name: "สี",
        values: [
          { label: "ขาว", stock: 18 },
          { label: "ดำ", stock: 15 },
        ],
      },
    ],
    imageCount: 2,
  },
  {
    name: "กระเป๋าเป้ผ้าแคนวาส",
    slug: "canvas-backpack",
    categorySlug: "bags",
    price: 259,
    stock: 22,
    description: "กระเป๋าเป้ผ้าแคนวาสทนทาน ช่องเก็บของหลากหลาย เหมาะกับการเรียนหรือทำงาน",
    optionGroups: [
      {
        name: "สี",
        values: [
          { label: "ดำ", stock: 8 },
          { label: "เขียวขี้ม้า", stock: 7 },
          { label: "เทา", stock: 7 },
        ],
      },
    ],
    imageCount: 3,
  },
  {
    name: "กระเป๋าสตางค์หนัง PU",
    slug: "pu-leather-wallet",
    categorySlug: "bags",
    price: 149,
    compareAtPrice: 199,
    stock: 40,
    description: "กระเป๋าสตางค์หนัง PU ดีไซน์เรียบหรู ช่องใส่บัตรเยอะ",
    imageCount: 2,
  },
  {
    name: "กระเป๋าผ้าสะพายข้าง",
    slug: "crossbody-fabric-bag",
    categorySlug: "bags",
    price: 189,
    stock: 1,
    description: "กระเป๋าผ้าสะพายข้างน้ำหนักเบา ใส่ของใช้ประจำวันได้พอดี",
    imageCount: 2,
  },
];

async function main() {
  console.log("Seeding database...");

  // ---- Admin ----
  const passwordHash = await bcrypt.hash("admin1234", 10);
  await prisma.admin.upsert({
    where: { username: "admin" },
    create: { username: "admin", passwordHash },
    update: {},
  });

  // ---- Store settings ----
  await prisma.storeSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      storeName: "ร้านลูกปลา 20 บาท",
      logoUrl: "/images/logo-placeholder.svg",
      bannerUrls: JSON.stringify([
        "/images/banner-placeholder-1.svg",
        "/images/banner-placeholder-2.svg",
      ]),
      promptpayId: "0812345678",
      bankName: "ธนาคารกสิกรไทย",
      bankAccountNumber: "123-4-56789-0",
      bankAccountName: "ร้านลูกปลา 20 บาท",
      codEnabled: true,
      shippingFlatRate: 40,
      freeShippingThreshold: 500,
    },
    update: {},
  });

  // ---- Categories ----
  const categoryBySlug = new Map<string, string>();
  for (const [index, cat] of CATEGORIES.entries()) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug, sortOrder: index },
      update: { name: cat.name, sortOrder: index },
    });
    categoryBySlug.set(cat.slug, created.id);
  }

  // ---- Products ----
  for (const [index, p] of PRODUCTS.entries()) {
    const categoryId = categoryBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${p.categorySlug}`);

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue; // idempotent re-seed: skip products already created

    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stock: p.stock,
        categoryId,
        sortOrder: index,
        images: {
          create: Array.from({ length: p.imageCount ?? 1 }, (_, i) => ({
            url: PLACEHOLDER_IMG,
            sortOrder: i,
          })),
        },
        optionGroups: p.optionGroups
          ? {
              create: p.optionGroups.map((group, gi) => ({
                name: group.name,
                sortOrder: gi,
                values: {
                  create: group.values.map((v, vi) => ({
                    label: v.label,
                    priceDelta: v.priceDelta ?? 0,
                    stock: v.stock,
                    sortOrder: vi,
                  })),
                },
              })),
            }
          : undefined,
      },
    });
  }

  // ---- Sample promotions ----
  const firstDiscountedProduct = await prisma.product.findFirst({
    where: { slug: "storage-box-20l" },
  });
  if (firstDiscountedProduct) {
    const existingProductPromo = await prisma.promotion.findFirst({
      where: { type: "PRODUCT_DISCOUNT", productId: firstDiscountedProduct.id },
    });
    if (!existingProductPromo) {
      await prisma.promotion.create({
        data: {
          type: "PRODUCT_DISCOUNT",
          discountType: "PERCENT",
          value: 10,
          productId: firstDiscountedProduct.id,
          isActive: true,
        },
      });
    }
  }

  await prisma.promotion.upsert({
    where: { code: "SAVE20" },
    create: {
      type: "COUPON",
      code: "SAVE20",
      discountType: "FIXED",
      value: 20,
      minOrderAmount: 200,
      maxUses: 100,
      isActive: true,
    },
    update: {},
  });

  console.log("Seed complete.");
  console.log("Admin login -> username: admin / password: admin1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
