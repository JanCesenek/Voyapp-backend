const express = require("express");
const { checkAuthMiddleWare } = require("../util/auth");

const router = express.Router();
const prisma = require("./prisma");

router
  .route("/destinations")
  .get(async (req, res) => {
    const destinations = await prisma.travel_destinations.findMany();
    res.json(destinations);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    if (data.userID === req.token.username) {
      const newPost = await prisma.travel_destinations.create({
        data,
      });
      res.status(201).json({ message: "Post created successfully!", newPost });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: {
          hacking: "You are not allowed to create posts for other users!",
        },
      });
  });

router
  .route("/destinations/:id")
  .patch(checkAuthMiddleWare, async (req, res) => {
    const id = +req.params.id;
    const data = req.body;
    const curPost = await prisma.travel_destinations.findUnique({
      where: {
        id,
      },
    });
    if (curPost.userID === req.token.username) {
      const updatedPost = await prisma.travel_destinations.update({
        where: {
          id,
        },
        data,
      });
      res.status(201).json({ message: "Post updated successfully!", updatedPost });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: {
          hacking: "You are not allowed to update posts for other users!",
        },
      });
  })
  .delete(checkAuthMiddleWare, async (req, res) => {
    const id = +req.params.id;
    const curPost = await prisma.travel_destinations.findUnique({
      where: {
        id,
      },
    });
    if (curPost.userID === req.token.username || req.token.admin) {
      const deletePost = await prisma.travel_destinations.delete({
        where: {
          id,
        },
      });
      res.status(201).json({ message: "Post deleted successfully!", deletePost });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: {
          hacking: "You are not allowed to delete posts for other users!",
        },
      });
  });

router
  .route("/destination-reservations")
  .get(async (req, res) => {
    const reservations = await prisma.travel_destination_reservations.findMany();
    res.json(reservations);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    const curPost = await prisma.travel_destinations.findUnique({
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
      const newReservation = await prisma.travel_destination_reservations.create({
        data,
      });
      const newNotification = await prisma.travel_notifications.create({
        data: {
          sender: data.userID,
          recipient: postOwner.username,
          destinationID: curPost.id,
          message: `${sender.firstName} ${sender.lastName} has booked ${data.people} ${
            data.people > 1 ? "spots" : "spot"
          } for ${curPost.name}.`,
          new: true,
        },
      });
      res
        .status(201)
        .json({ message: "Reservation created successfully!", newReservation, newNotification });
    } else
      res.status(401).json({
        message: "Not authorized",
        errors: {
          hacking: "You are not allowed to create reservations for other users!",
        },
      });
  });

router.delete("/destination-reservations/:id", checkAuthMiddleWare, async (req, res) => {
  const id = +req.params.id;
  const curReservation = await prisma.travel_destination_reservations.findUnique({
    where: {
      id,
    },
  });
  const curPost = await prisma.travel_destinations.findUnique({
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
    const deletedReservation = await prisma.travel_destination_reservations.delete({
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
        destinationID: curPost.id,
        message: `${
          curReservation.userID === req.token.username
            ? `${sender.firstName} ${sender.lastName}`
            : `${postOwner.firstName} ${postOwner.lastName}`
        } has cancelled ${
          postOwner.username === req.token.username ? "your" : hisOrHer
        } reservation for ${curPost.name}`,
      },
    });
    res.status(201).json({
      message: "Reservation cancelled successfully!",
      deletedReservation,
      deletedNotification,
    });
  } else
    res.status(401).json({
      message: "Not authorized",
      errors: {
        hacking: "You are not allowed to cancel reservations for other users!",
      },
    });
});

router
  .route("/likes")
  .get(async (req, res) => {
    const likes = await prisma.travel_likes.findMany();
    res.json(likes);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    const curPost = await prisma.travel_destinations.findUnique({
      where: {
        id: data.postID,
      },
    });
    const alreadyLiked = await prisma.travel_likes.findFirst({
      where: {
        postID: curPost.id,
        userID: req.token.username,
      },
    });
    if (data.userID === req.token.username && !alreadyLiked) {
      const newLike = await prisma.travel_likes.create({
        data,
      });
      res.status(201).json({ messsage: "Post liked successfully!", newLike });
    } else
      res.status(401).json({
        message: "Not authorized",
        errors: {
          hacking: "You are not allowed to like posts for other users!",
        },
      });
  });

router.delete("/likes/:id", checkAuthMiddleWare, async (req, res) => {
  const id = +req.params.id;
  const curLike = await prisma.travel_likes.findUnique({
    where: {
      id,
    },
  });
  if (curLike.userID === req.token.username) {
    const deletedLike = await prisma.travel_likes.delete({
      where: {
        id,
      },
    });
    res.status(201).json({ message: "Like removed successfully!", deletedLike });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: {
        hacking: "You are not allowed to remove likes for other users!",
      },
    });
});

router
  .route("/dislikes")
  .get(async (req, res) => {
    const dislikes = await prisma.travel_dislikes.findMany();
    res.json(dislikes);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    const curPost = await prisma.travel_destinations.findUnique({
      where: {
        id: data.postID,
      },
    });
    const alreadyDisliked = await prisma.travel_dislikes.findFirst({
      where: {
        postID: curPost.id,
        userID: req.token.username,
      },
    });
    if (data.userID === req.token.username && !alreadyDisliked) {
      const newDislike = await prisma.travel_dislikes.create({
        data,
      });
      res.status(201).json({ messsage: "Post disliked successfully!", newDislike });
    } else
      res.status(401).json({
        message: "Not authorized",
        errors: {
          hacking: "You are not allowed to dislike posts for other users!",
        },
      });
  });

router.delete("/dislikes/:id", checkAuthMiddleWare, async (req, res) => {
  const id = +req.params.id;
  const curDislike = await prisma.travel_dislikes.findUnique({
    where: {
      id,
    },
  });
  if (curDislike.userID === req.token.username) {
    const deletedDislike = await prisma.travel_dislikes.delete({
      where: {
        id,
      },
    });
    res.status(201).json({ message: "Dislike removed successfully!", deletedDislike });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: {
        hacking: "You are not allowed to remove dislikes for other users!",
      },
    });
});

router
  .route("/comments")
  .get(async (req, res) => {
    const comments = await prisma.travel_comments.findMany();
    res.json(comments);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    if (data.userID === req.token.username) {
      const newComment = await prisma.travel_comments.create({
        data,
      });
      res.status(201).json({ message: "Comment created successfully!", newComment });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: { hacking: "You are not allowed to create comments for other users!" },
      });
  });

router.delete("/comments/:id", checkAuthMiddleWare, async (req, res) => {
  const id = +req.params.id;
  const curComment = await prisma.travel_comments.findUnique({
    where: {
      id,
    },
  });
  if (curComment.userID === req.token.username) {
    const deletedComment = await prisma.travel_comments.delete({
      where: {
        id,
      },
    });
    res.status(201).json({ message: "Comment deleted successfully!", deletedComment });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: { hacking: "You are not allowed to delete comments for other users!" },
    });
});

router
  .route("/destination-pictures")
  .get(async (req, res) => {
    const pictures = await prisma.travel_destination_pictures.findMany();
    res.json(pictures);
  })
  .post(checkAuthMiddleWare, async (req, res) => {
    const data = req.body;
    if (data.userID === req.token.username) {
      const newPicture = await prisma.travel_destination_pictures.create({
        data,
      });
      res.status(201).json({ message: "Picture added successfully!", newPicture });
    } else
      res.status(401).json({
        message: "Not authorized.",
        errors: { hacking: "You are not allowed to create pictures for other users!" },
      });
  });

router.delete("/destination-pictures/:id", checkAuthMiddleWare, async (req, res) => {
  const id = +req.params.id;
  const curPicture = await prisma.travel_destination_pictures.findUnique({
    where: {
      id,
    },
  });
  if (curPicture.userID === req.token.username) {
    const deletedPicture = await prisma.travel_destination_pictures.findUnique({
      where: {
        id,
      },
    });
    res.status(201).json({ message: "Picture deleted successfully!", deletedPicture });
  } else
    res.status(401).json({
      message: "Not authorized.",
      errors: { hacking: "You are not allowed to delete pictures for other users!" },
    });
});

module.exports = router;
