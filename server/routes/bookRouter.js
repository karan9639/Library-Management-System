import {
  isAuthenticated,
  isAuthorized,
} from "../middlewares/authMiddleware.js";
import {
  addBook,
  deleteBook,
  getAllBooks,
} from "../controllers/bookController.js";
import express from "express";

const router = express.Router();

router.post("/admin/add", isAuthenticated, isAuthorized("Admin"), addBook);
router.delete(
  "/admin/delete/:id",
  isAuthenticated,
  isAuthorized("Admin"),
  deleteBook
);
router.get("/books", isAuthenticated, getAllBooks);

export default router;
