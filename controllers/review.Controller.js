const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getPagination, getPaginationMeta } = require("../utils/pagination");

// Controller for Review
class ReviewController {
  // Create a new review
  async createReview(req, res) {
    try {
      const { id_pasien, id_janji, id_konsultasi, rating, komentar } = req.body;

      // Validate rating (must be between 1 and 5)
      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: "Rating must be between 1 and 5" });
      }

      // Create the review
      const review = await prisma.review.create({
        data: {
          id_pasien,
          id_janji,
          id_konsultasi,
          rating,
          komentar,
        },
      });

      return res
        .status(201)
        .json({ message: "Review created successfully", review });
    } catch (error) {
      console.error("Error creating review:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async getAllReviews(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;

      // Build where condition for search
      const whereCondition = {};
      if (search) {
        whereCondition.pasien = {
          nama: {
            contains: search,
            mode: "insensitive", // case-insensitive search
          },
        };
      }

      // Get paginated reviews
      const { skip, take } = getPagination(page, limit);

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: whereCondition,
          include: {
            pasien: true,
            janjiTemu: true,
            konsultasiChat: true,
          },
          skip,
          take,
        }),
        prisma.review.count({ where: whereCondition }),
      ]);

      const meta = getPaginationMeta(total, take, parseInt(page));

      return res.status(200).json({
        message: "All reviews fetched successfully",
        data: reviews,
        meta,
      });
    } catch (error) {
      console.error("Error fetching all reviews:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get reviews by patient ID
  async getReviewsByPatientId(req, res) {
    try {
      const { id_pasien } = req.params;

      const reviews = await prisma.review.findMany({
        where: { id_pasien },
        include: {
          janjiTemu: true, // Include janji temu details
          konsultasiChat: true, // Include konsultasi chat details
        },
      });

      return res
        .status(200)
        .json({ message: "Reviews fetched successfully", reviews });
    } catch (error) {
      console.error("Error fetching reviews by patient ID:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get average rating by patient ID
  async getAverageRatingByPatientId(req, res) {
    try {
      const { id_pasien } = req.params;

      const reviews = await prisma.review.findMany({
        where: { id_pasien },
      });

      if (reviews.length === 0) {
        return res
          .status(404)
          .json({ message: "No reviews found for this patient" });
      }

      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = totalRating / reviews.length;

      return res.status(200).json({
        message: "Average rating fetched successfully",
        averageRating,
      });
    } catch (error) {
      console.error("Error fetching average rating:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new ReviewController();
