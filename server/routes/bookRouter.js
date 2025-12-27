import { isAuthenticatedUser, isAuthorized } from "../middlewares/authMiddleware.js";
import { addBook, deleteBook, getAllBooks } from "../controllers/bookController.js";
import express from "express";

const router = express.Router();

router.post("/admin/add", isAuthenticatedUser, isAuthorized("Admin"), addBook);
router.delete("/admin/delete/:id", isAuthenticatedUser, isAuthorized("Admin"), deleteBook);
router.get("/books", isAuthenticatedUser, getAllBooks);

export default router;