import bcrypt from "bcryptjs";
import { PrismaClient, type ServiceType } from "@prisma/client";

const prisma = new PrismaClient();

const temple = {
  slug: "yunlan",
  name: "示例云岚寺",
  summary: "单寺院示例。信众可在线登记祈福、点灯与牌位，寺院工作人员在管理端核对后办理。",
  description:
    "本数据仅用于演示云寺院办理流程，不对应真实寺院。页面金额为事务登记费用。系统不宣传、不承诺任何宗教效验、感应或超度结果。",
  address: "示例地址，非真实寺院",
};

const halls: Array<{
  slug: string;
  name: string;
  summary: string;
  description: string;
  sortOrder: number;
  services: Array<{
    type: ServiceType;
    title: string;
    description: string;
    priceCents: number;
    termDays: number | null;
    sortOrder: number;
  }>;
  slots: Array<{ type: ServiceType; prefix: string; count: number; termDays: number }>;
}> = [
  {
    slug: "daxiong",
    name: "大雄宝殿",
    summary: "主殿。办理日常祈福、点灯与吉祥牌位登记。",
    description:
      "大雄宝殿为主殿。信众可在此登记祈福、点灯与吉祥牌位。提交后由寺院工作人员核对，再进入支付与办理。未选择灯位或牌位时，由寺院安排具体位置。",
    sortOrder: 1,
    services: [
      {
        type: "PRAYER",
        title: "祈福",
        description: "登记祈福对象与意向。审核通过后支付登记费用，由寺院按记录办理。",
        priceCents: 6800,
        termDays: null,
        sortOrder: 1,
      },
      {
        type: "LAMP",
        title: "点灯",
        description: "登记点灯说明与灯位。可选空闲灯位；不选则由寺院安排。",
        priceCents: 3600,
        termDays: 30,
        sortOrder: 2,
      },
      {
        type: "AUSPICIOUS_TABLET",
        title: "吉祥牌位",
        description: "为在世亲眷登记吉祥牌位文字与位置。",
        priceCents: 12800,
        termDays: 365,
        sortOrder: 3,
      },
    ],
    slots: [
      { type: "LAMP", prefix: "L", count: 8, termDays: 30 },
      { type: "AUSPICIOUS_TABLET", prefix: "J", count: 4, termDays: 365 },
    ],
  },
  {
    slug: "dizang",
    name: "地藏殿",
    summary: "办理往生牌位，以及相关祈福、点灯登记。",
    description:
      "地藏殿用于往生牌位及相关祈福、点灯登记。请如实填写往生者姓名与牌位文字。寺院依登记信息安排制作与安位。本站不承诺超度或其他宗教效验。",
    sortOrder: 2,
    services: [
      {
        type: "PRAYER",
        title: "祈福",
        description: "登记在地藏殿办理的祈福内容。",
        priceCents: 6800,
        termDays: null,
        sortOrder: 1,
      },
      {
        type: "MEMORIAL_TABLET",
        title: "往生牌位",
        description: "登记往生者姓名与牌位文字。不承诺宗教效验。",
        priceCents: 12800,
        termDays: 365,
        sortOrder: 2,
      },
      {
        type: "LAMP",
        title: "点灯",
        description: "登记地藏殿灯位与点灯说明。",
        priceCents: 3600,
        termDays: 30,
        sortOrder: 3,
      },
    ],
    slots: [
      { type: "MEMORIAL_TABLET", prefix: "W", count: 6, termDays: 365 },
      { type: "LAMP", prefix: "D", count: 4, termDays: 30 },
    ],
  },
];

async function upsertDemoUser(email: string, name: string, password: string, role: "ADMIN" | "DEVOTEE") {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, provider: "EMAIL" },
    create: { email, name, role, passwordHash, provider: "EMAIL" },
  });
}

async function main() {
  const savedTemple = await prisma.temple.upsert({
    where: { slug: temple.slug },
    update: {
      name: temple.name,
      summary: temple.summary,
      description: temple.description,
      address: temple.address,
    },
    create: temple,
  });

  for (const hall of halls) {
    const savedHall = await prisma.hall.upsert({
      where: { templeId_slug: { templeId: savedTemple.id, slug: hall.slug } },
      update: {
        name: hall.name,
        summary: hall.summary,
        description: hall.description,
        sortOrder: hall.sortOrder,
        enabled: true,
      },
      create: {
        templeId: savedTemple.id,
        slug: hall.slug,
        name: hall.name,
        summary: hall.summary,
        description: hall.description,
        sortOrder: hall.sortOrder,
        enabled: true,
      },
    });

    for (const service of hall.services) {
      await prisma.hallService.upsert({
        where: { hallId_type: { hallId: savedHall.id, type: service.type } },
        update: {
          title: service.title,
          description: service.description,
          priceCents: service.priceCents,
          currency: "CNY",
          termDays: service.termDays,
          enabled: true,
          sortOrder: service.sortOrder,
        },
        create: {
          hallId: savedHall.id,
          type: service.type,
          title: service.title,
          description: service.description,
          priceCents: service.priceCents,
          currency: "CNY",
          termDays: service.termDays,
          enabled: true,
          sortOrder: service.sortOrder,
        },
      });
    }

    for (const group of hall.slots) {
      for (let i = 1; i <= group.count; i += 1) {
        const locationCode = `${group.prefix}-${String(i).padStart(2, "0")}`;
        await prisma.offeringSlot.upsert({
          where: {
            hallId_type_locationCode: {
              hallId: savedHall.id,
              type: group.type,
              locationCode,
            },
          },
          update: { termDays: group.termDays },
          create: {
            hallId: savedHall.id,
            type: group.type,
            locationCode,
            termDays: group.termDays,
            status: "AVAILABLE",
          },
        });
      }
    }
  }

  // 演示账号每次种子都重置密码，保证 README 中的登录信息可用。
  await upsertDemoUser("admin@example.com", "管理员", "admin123456", "ADMIN");
  await upsertDemoUser("devotee@example.com", "陈信众", "devotee123456", "DEVOTEE");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
