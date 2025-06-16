const express = require("express");
const router = express.Router();

const review = require("../controllers/review.Controller");
const authMiddleware = require("../middlewares/auth");

// Create a new review
router.post("/reviews", authMiddleware, review.createReview);

// Get all reviews
router.get("/reviews", authMiddleware, review.getAllReviews);

// Get reviews by patient ID
router.get(
  "/reviews/patient/:id_pasien",
  authMiddleware,
  review.getReviewsByPatientId
);

// Get average rating by patient ID
router.get(
  "/reviews/patient/:id_pasien/average-rating",
  authMiddleware,
  review.getAverageRatingByPatientId
);

module.exports = router;
