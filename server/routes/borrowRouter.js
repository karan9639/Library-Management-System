import express from "express";
import { borrowedBooks, recordBorrowedBook, getBorrowedBooksForAdmin, returnBorrowedBook } from "../controllers/borrowController.js";
import { isAuthenticatedUser, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/record-borrow-book/:id",isAuthenticatedUser, isAuthorized("Admin") ,recordBorrowedBook);

router.get("/borrowed-books-by-user", isAuthenticatedUser, isAuthorized("Admin"), getBorrowedBooksForAdmin);

router.get("/my-borrowed-books", isAuthenticatedUser, borrowedBooks);

router.put("/return-borrowed-book/:bookId", isAuthenticatedUser, isAuthorized("Admin"), returnBorrowedBook);

export default router;
