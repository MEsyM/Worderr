import bcrypt from "bcryptjs";
import { PrismaClient, RoomRole, RoomStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.vote.deleteMany();
  await prisma.summary.deleteMany();
  await prisma.turn.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.room.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin Director",
      role: UserRole.ADMIN,
      passwordHash,
    },
  });

  const director = await prisma.user.create({
    data: {
      email: "director@example.com",
      name: "Director Dana",
      role: UserRole.DIRECTOR,
      passwordHash,
    },
  });

  const host = await prisma.user.create({
    data: {
      email: "host@example.com",
      name: "Host Harper",
      role: UserRole.HOST,
      passwordHash,
    },
  });

  const player = await prisma.user.create({
    data: {
      email: "player@example.com",
      name: "Player Parker",
      role: UserRole.PLAYER,
      passwordHash,
    },
  });

  const room = await prisma.room.create({
    data: {
      title: "Demo Jam Session",
      code: "DEMO123",
      description: "A seeded session showcasing LingvoJam's core data model.",
      status: RoomStatus.ACTIVE,
      host: { connect: { id: host.id } },
      memberships: {
        create: [
          { user: { connect: { id: host.id } }, role: RoomRole.HOST },
          { user: { connect: { id: director.id } }, role: RoomRole.DIRECTOR },
          { user: { connect: { id: player.id } }, role: RoomRole.PLAYER },
        ],
      },
    },
    include: {
      memberships: true,
    },
  });

  const turnOne = await prisma.turn.create({
    data: {
      room: { connect: { id: room.id } },
      author: { connect: { id: player.id } },
      round: 1,
      prompt: "Kick off the story with a mysterious word.",
      content: "Echoes ripple through the hall as the word 'Aurelian' is whispered.",
      votes: {
        create: [
          { voter: { connect: { id: host.id } }, value: 1 },
          { voter: { connect: { id: director.id } }, value: 1 },
        ],
      },
    },
    include: {
      votes: true,
    },
  });

  await prisma.summary.create({
    data: {
      room: { connect: { id: room.id } },
      turn: { connect: { id: turnOne.id } },
      content:
        "Harper's crew rallies around Parker's opening, weaving golden imagery into the night.",
    },
  });

  await prisma.summary.create({
    data: {
      room: { connect: { id: room.id } },
      content: "Session primed with one completed turn and room members ready for the next cue.",
    },
  });

  await prisma.membership.create({
    data: {
      user: { connect: { id: admin.id } },
      room: { connect: { id: room.id } },
      role: RoomRole.DIRECTOR,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
