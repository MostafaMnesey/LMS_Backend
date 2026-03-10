import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const roles = [
  { name: "Admin" },
  { name: "Teacher" },
  { name: "Student" },
];

export async function seedRoles() {
  console.log("Start seeding roles and linking permissions...");

  // 1. Seed Roles
  const seededRoles = await Promise.all(
    roles.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: role,
        create: role,
      }),
    ),
  );

  const roleMap = seededRoles.reduce((acc, role) => {
    acc[role.name] = role.id;
    return acc;
  }, {});

  // 2. Fetch all permissions to map them
  const allPermissions = await prisma.permission.findMany();
  const permMap = allPermissions.reduce((acc, perm) => {
    acc[perm.name] = perm.id;
    return acc;
  }, {});

  // 3. Define Role-Permission relationships
  const rolePermissions = [
    // Admin gets everything
    ...allPermissions.map((p) => ({
      roleId: roleMap["Admin"],
      permissionId: p.id,
    })),

    // Teacher permissions
    { roleId: roleMap["Teacher"], permissionId: permMap["view_subjects"] },
    { roleId: roleMap["Teacher"], permissionId: permMap["view_plans"] },

    // Student permissions
    { roleId: roleMap["Student"], permissionId: permMap["view_subjects"] },
    { roleId: roleMap["Student"], permissionId: permMap["view_plans"] },
  ].filter((rp) => rp.roleId && rp.permissionId);

  // 4. Seed RolePermission mapping
  await Promise.all(
    rolePermissions.map((rp) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: rp.roleId,
            permissionId: rp.permissionId,
          },
        },
        update: rp,
        create: rp,
      }),
    ),
  );

  console.log("Seeded roles and linked permissions.");
  return seededRoles;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedRoles()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}
