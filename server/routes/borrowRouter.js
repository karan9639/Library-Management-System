import express from "express";
import {
  borrowedBooks,
  recordBorrowedBook,
  getBorrowedBooksForAdmin,
  returnBorrowedBook,
} from "../controllers/borrowController.js";

import {
  isAuthenticated,
  isAuthorized,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/record-borrow-book/:id",
  isAuthenticated,
  isAuthorized("Admin", "user"),
  recordBorrowedBook
);

router.get(
  "/borrowed-books-by-user",
  isAuthenticated,
  isAuthorized("Admin", "user"),
  getBorrowedBooksForAdmin
);

router.get("/my-borrowed-books", isAuthenticated, borrowedBooks);

router.put(
  "/return-borrowed-book/:borrowId",
  isAuthenticated,
  isAuthorized("Admin", "user"),
  returnBorrowedBook
);

export default router;
