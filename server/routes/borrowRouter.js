import express from "express";
import {
  borrowedBooks,
  recordBorrowedBook,
  getBorrowedBooksForAdmin,
  returnBorrowedBook,
} from "../controllers/borrowController.js";

import {
  isAuthenticatedUser,
  isAuthorized,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Admin: record borrow for a user by email
router.post(
  "/record-borrow-book/:id",
  isAuthenticatedUser,
  isAuthorized("Admin", "user"),
  recordBorrowedBook
);

// Admin: view all borrows
router.get(
  "/borrowed-books-by-user",
  isAuthenticatedUser,
  isAuthorized("Admin", "user"),
  getBorrowedBooksForAdmin
);

// User: my borrowed books
router.get("/my-borrowed-books", isAuthenticatedUser, borrowedBooks);

// Admin: return by borrowId
router.put(
  "/return-borrowed-book/:borrowId",
  isAuthenticatedUser,
  isAuthorized("Admin", "user"),
  returnBorrowedBook
);

export default router;
