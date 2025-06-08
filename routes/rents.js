const express = require("express");
const { checkAuthMiddleWare } = require("../util/auth");

const router = express.Router();
const prisma = require("./prisma");

router
  .route("/rents")
  .get(async (req, res) => {
    const rents = await prisma.travel_rents.findMany();
    res.json(rents);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    if (data.userID === req.token.username) {
      const newPost = await prisma.travel_rents.create({
        data,
      });
      res.status(201).json({ message: "Post created successfully!", newPost });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: { hacking: "You are not allowed to create posts for other users!" },
      });
  });

router
  .route("/rents/:id")
  .patch(checkAuthMiddleWare, async (req, res) => {
    const id = +req.params.id;
    const data = req.body;
    const curPost = await prisma.travel_rents.findUnique({
      where: {
        id,
      },
    });
    if (curPost.userID === req.token.username) {
      const updatedPost = await prisma.travel_rents.update({
        where: {
          id,
        },
        data,
      });
      res.status(201).json({ message: "Post updated successfully!", updatedPost });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: { hacking: "You are not allowed to delete posts for other users!" },
      });
  })
  .delete(checkAuthMiddleWare, async (req, res) => {
    const id = +req.params.id;
    const curPost = await prisma.travel_rents.findUnique({
      where: {
        id,
      },
    });
    if (curPost.userID === req.token.username || req.token.admin) {
      const deletePost = await prisma.travel_rents.delete({
        where: {
          id,
        },
      });
      res.status(201).json({ message: "Post deleted successfully!", deletePost });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: { hacking: "You are not allowed to delete posts for other users!" },
      });
  });

router
  .route("/reviews")
  .get(async (req, res) => {
    const reviews = await prisma.travel_rent_reviews.findMany();
    res.json(reviews);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    const alreadyReviewed = await prisma.travel_rent_reviews.findFirst({
      where: {
        userID: data.userID,
        postID: data.postID,
      },
    });
    if (data.userID === req.token.username && !alreadyReviewed) {
      const newReview = await prisma.travel_rent_reviews.create({
        data,
      });
      res.status(201).json({ message: "Review created successfully!", newReview });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: { hacking: "You are not allowed to create reviews for other users!" },
      });
  });

router.delete("/reviews/:id", checkAuthMiddleWare, async (req, res) => {
  const id = +req.params.id;
  const curReview = await prisma.travel_rent_reviews.findUnique({
    where: {
      id,
    },
  });
  if (curReview.userID === req.token.username) {
    const deletedReview = await prisma.travel_rent_reviews.delete({
      where: {
        id,
      },
    });
    res.status(201).json({ message: "Review deleted successfully!", deletedReview });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: { hacking: "You are not allowed to delete review for other users!" },
    });
});

router
  .route("/rent-reservations")
  .get(async (req, res) => {
    const reservations = await prisma.travel_rent_reservations.findMany();
    res.json(reservations);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    const curPost = await prisma.travel_rents.findUnique({
      where: {
        id: data.postID,
      },
    });
    const postOwner = await prisma.travel_users.findUnique({
      where: {
        username: curPost.userID,
      },
    });
    const sender = await prisma.travel_users.findUnique({
      where: {
        username: data.userID,
      },
    });
    if (data.userID === req.token.username) {
      const realStartDate =
        String(data.startDate).slice(8, 10) +
        " / " +
        String(data.startDate).slice(5, 7) +
        " / " +
        String(data.startDate).slice(0, 4);
      const realEndDate =
        String(data.endDate).slice(8, 10) +
        " / " +
        String(data.endDate).slice(5, 7) +
        " / " +
        String(data.endDate).slice(0, 4);
      const newReservation = await prisma.travel_rent_reservations.create({
        data,
      });
      const newNotification = await prisma.travel_notifications.create({
        data: {
          sender: data.userID,
          recipient: postOwner.username,
          rentID: curPost.id,
          message: `${sender.firstName} ${sender.lastName} has booked ${data.people} ${
            data.people > 1 ? "spots" : "spot"
          } for ${curPost.name} from ${realStartDate} to ${realEndDate}.`,
          new: true,
        },
      });
      res
        .status(201)
        .json({ message: "Reservation created successfully!", newReservation, newNotification });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: { hacking: "You are not allowed to create reservations for other users!" },
      });
  });

router.delete("/rent-reservations/:id", checkAuthMiddleWare, async (req, res) => {
  const id = +req.params.id;
  const curReservation = await prisma.travel_rent_reservations.findUnique({
    where: {
      id,
    },
  });
  const curPost = await prisma.travel_rents.findUnique({
    where: {
      id: curReservation.postID,
    },
  });
  const sender = await prisma.travel_users.findUnique({
    where: {
      username: curReservation.userID,
    },
  });
  const postOwner = await prisma.travel_users.findUnique({
    where: {
      username: curPost.userID,
    },
  });
  if (curReservation.userID === req.token.username || postOwner.username === req.token.username) {
    const realStartDate =
      String(curReservation.startDate).slice(8, 10) +
      " " +
      String(curReservation.startDate).slice(4, 7) +
      " " +
      String(curReservation.startDate).slice(11, 15);
    const realEndDate =
      String(curReservation.endDate).slice(8, 10) +
      " " +
      String(curReservation.endDate).slice(4, 7) +
      " " +
      String(curReservation.endDate).slice(11, 15);
    const deletedReservation = await prisma.travel_rent_reservations.delete({
      where: {
        id,
      },
    });
    const hisOrHer = sender.gender === "M" ? "his" : "her";
    const deletedNotification = await prisma.travel_notifications.create({
      data: {
        sender: req.token.username,
        recipient:
          curReservation.userID === req.token.username ? postOwner.username : curReservation.userID,
        rentID: curPost.id,
        message: `${
          curReservation.userID === req.token.username
            ? `${sender.firstName} ${sender.lastName}`
            : `${postOwner.firstName} ${postOwner.lastName}`
        } has cancelled ${
          postOwner.username === req.token.username ? "your" : hisOrHer
        } reservation for ${curPost.name} from ${realStartDate} to ${realEndDate}`,
      },
    });
    res.status(201).json({
      message: "Reservation cancelled successfully!",
      deletedReservation,
      deletedNotification,
    });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: { hacking: "You are not allowed to cancel reservations for other users!" },
    });
});

router
  .route("/rent-pictures")
  .get(async (req, res) => {
    const pictures = await prisma.travel_rent_pictures.findMany();
    res.json(pictures);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    if (data.userID === req.token.username) {
      const newPicture = await prisma.travel_rent_pictures.create({
        data,
      });
      res.status(201).json({ message: "Picture added successfully!", newPicture });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: { hacking: "You are not allowed to create pictures for other users!" },
      });
  });

router.delete("/rent-pictures/:id", checkAuthMiddleWare, async (req, res) => {
  const id = +req.params.id;
  const curPicture = await prisma.travel_rent_pictures.findUnique({
    where: {
      id,
    },
  });
  if (curPicture.userID === req.token.username) {
    const deletedPicture = await prisma.travel_rent_pictures.findUnique({
      where: {
        id,
      },
    });
    res.status(201).json({ message: "Pictures deleted successfully!", deletedPicture });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: { hacking: "You are not allowed to delete pictures for other users!" },
    });
});

module.exports = router;
