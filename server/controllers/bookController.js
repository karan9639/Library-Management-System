import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Book } from "../models/bookModel.js";

/**
 * Helpers
 */
const toNumber = (value) => {
  // Handles " 10 ", "10", 10; returns NaN for "", null, undefined, "abc"
  if (value === null || value === undefined) return NaN;
  const num = Number(String(value).trim());
  return num;
};

const requiredTrimmed = (value) =>
  typeof value === "string" && value.trim().length > 0;

/**
 * POST /api/v1/book/admin/add
 */
export const addBook = catchAsyncErrors(async (req, res, next) => {
  const { title, author, description, price, quantity } = req.body || {};

  // Validate text fields
  if (!requiredTrimmed(title))
    return next(new ErrorHandler("Title is required", 400));
  if (!requiredTrimmed(author))
    return next(new ErrorHandler("Author is required", 400));
  if (!requiredTrimmed(description))
    return next(new ErrorHandler("Description is required", 400));

  // Validate numeric fields
  const priceNum = toNumber(price);
  const quantityNum = toNumber(quantity);

  if (!Number.isFinite(priceNum))
    return next(new ErrorHandler("Price must be a valid number", 400));
  if (!Number.isFinite(quantityNum))
    return next(new ErrorHandler("Quantity must be a valid number", 400));

  if (priceNum <= 0)
    return next(new ErrorHandler("Price must be greater than 0", 400));
  if (!Number.isInteger(quantityNum))
    return next(new ErrorHandler("Quantity must be an integer", 400));
  if (quantityNum < 0)
    return next(new ErrorHandler("Quantity cannot be negative", 400));

  const newBook = await Book.create({
    title: title.trim(),
    author: author.trim(),
    description: description.trim(),
    price: priceNum,
    quantity: quantityNum,
    availability: quantityNum > 0,
  });

  res.status(201).json({
    success: true,
    message: "Book added successfully",
    book: newBook,
  });
});

/**
 * DELETE /api/v1/book/admin/delete/:id
 */
export const deleteBook = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const book = await Book.findById(id);
  if (!book) return next(new ErrorHandler("Book not found", 404));

  await book.deleteOne();

  res.status(200).json({
    success: true,
    message: "Book deleted successfully",
  });
});

/**
 * GET /api/v1/book/books
 * Optional query params:
 *  - page (default 1)
 *  - limit (default 10, max 100)
 *  - q (search by title/author)
 */
export const getAllBooks = catchAsyncErrors(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit || "10", 10))
  );
  const q = (req.query.q || "").trim();

  const filter = q
    ? {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { author: { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const skip = (page - 1) * limit;

  const [books, total] = await Promise.all([
    Book.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Book.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    books,
  });
});
