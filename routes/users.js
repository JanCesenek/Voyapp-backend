const express = require("express");
const { checkAuthMiddleWare } = require("../util/auth");

const router = express.Router();
const prisma = require("./prisma");

router.get("/users", async (req, res) => {
  const users = await prisma.traveling_users.findMany();
  res.json(users);
});

router
  .route("/users/:username")
  .patch(checkAuthMiddleWare, async (req, res) => {
    if (req.params.username === req.token.username) {
      const updatedUser = await prisma.traveling_users.update({
        where: {
          username: req.params.username,
        },
        data: req.body,
      });
      res.status(201).json({ message: "User updated successfully!", updatedUser });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: {
          hacking: "You are not allowed to update other user's details!",
        },
      });
  })
  .delete(checkAuthMiddleWare, async (req, res) => {
    if (req.params.username === req.token.username || req.token.admin) {
      const deletedUser = await prisma.traveling_users.delete({
        where: {
          username: req.params.username,
        },
      });
      res.status(201).json({ message: "User deleted successfully!", deletedUser });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: {
          hacking: "You are not allowed to delete other users!",
        },
      });
  });

router.get("/notifications", async (req, res) => {
  const notifications = await prisma.notifications.findMany();
  res.json(notifications);
});

router.delete("/notifications/:id", checkAuthMiddleWare, async (req, res) => {
  const id = +req.params.id;
  const curNotification = await prisma.notifications.findUnique({
    where: {
      id,
    },
  });
  if (curNotification.recipient === req.token.username) {
    const deletedNotification = await prisma.notifications.delete({
      where: {
        id,
      },
    });
    res.status(201).json({ message: "Notification deleted successfully", deletedNotification });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: { hacking: "You are not allowed to delete notifications for other users!" },
    });
});

module.exports = router;
