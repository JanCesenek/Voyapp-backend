const { NotFoundError } = require("../util/errors");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function get(username) {
  const user = await prisma.traveling_users.findUnique({
    where: {
      username,
    },
  });
  console.log(user);
  if (!user) {
    throw new NotFoundError("Could not find any users that match.");
  }
  return user;
}

exports.get = get;
