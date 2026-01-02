import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Borrow } from "../models/borrowModel.js";
import { Book } from "../models/bookModel.js";
import { User } from "../models/userModel.js";
import { calculateFine, formatINR } from "../utils/fineCalculator.js";

/**
 * Helpers
 */
const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const addDaysFrom = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * GET /api/v1/borrow/my-borrowed-books
 * Borrow history for logged-in user
 */
export const borrowedBooks = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) return next(new ErrorHandler("Unauthorized", 401));

  const borrows = await Borrow.find({ "user.id": userId })
    .populate("book", "title author price")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: borrows.length,
    borrows,
  });
});

/**
 * POST /api/v1/borrow/record-borrow-book/:id
 * body: { email }
 */
export const recordBorrowedBook = catchAsyncErrors(async (req, res, next) => {
  const bookId = req.params?.id;
  const email = normalizeEmail(req.body?.email);

  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return next(new ErrorHandler("Invalid book id", 400));
  }
  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  // 1) Find user
  const user = await User.findOne({ email }).select("name email");
  if (!user) return next(new ErrorHandler("User not found", 404));

  // 2) Prevent double borrow (active borrow)
  const alreadyBorrowed = await Borrow.findOne({
    "user.id": user._id,
    book: bookId,
    returned: false,
  });

  if (alreadyBorrowed) {
    return next(new ErrorHandler("User has already borrowed this book", 400));
  }

  // 3) Atomically decrement quantity if available
  const book = await Book.findOneAndUpdate(
    { _id: bookId, quantity: { $gt: 0 } },
    { $inc: { quantity: -1 } },
    { new: true }
  );

  if (!book) {
    const exists = await Book.exists({ _id: bookId });
    return next(
      exists
        ? new ErrorHandler("Book is currently unavailable", 400)
        : new ErrorHandler("Book not found", 404)
    );
  }

  // 4) Update availability based on new quantity
  const shouldBeAvailable = book.quantity > 0;
  if (book.availability !== shouldBeAvailable) {
    book.availability = shouldBeAvailable;
    await book.save();
  }

  // ✅ Fix dueDate bug: dueDate must be based on borrowDate
  const borrowDate = new Date();
  const dueDate = addDaysFrom(borrowDate, 7);

  // 5) Create borrow record
  const borrow = await Borrow.create({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    book: book._id,
    price: book.price,
    borrowDate,
    dueDate,
    returned: false,
    returnDate: null,
    fine: 0,
    notified: false,
  });

  return res.status(201).json({
    success: true,
    message: "Book borrowed successfully",
    borrow,
  });
});

/**
 * GET /api/v1/borrow/borrowed-books-by-user
 * Query:
 *  - returned=true/false
 *  - q=search (email or name or book title)
 */
export const getBorrowedBooksForAdmin = catchAsyncErrors(
  async (req, res, next) => {
    const returned =
      req.query.returned === undefined
        ? undefined
        : req.query.returned === "true";

    const q = (req.query.q || "").trim().toLowerCase();

    const filter = {};
    if (returned !== undefined) filter.returned = returned;

    const borrows = await Borrow.find(filter)
      .populate("book", "title author price")
      .sort({ createdAt: -1 });

    const filtered = q
      ? borrows.filter((b) => {
          const email = (b.user?.email || "").toLowerCase();
          const name = (b.user?.name || "").toLowerCase();
          const title = (b.book?.title || "").toLowerCase();
          return email.includes(q) || name.includes(q) || title.includes(q);
        })
      : borrows;

    return res.status(200).json({
      success: true,
      count: filtered.length,
      borrows: filtered,
    });
  }
);

/**
 * PUT /api/v1/borrow/return-borrowed-book/:borrowId
 *
 * ✅ Correct usage: pass real borrowId
 * ✅ Fallback: if frontend passes bookId by mistake, send body { email }
 */
export const returnBorrowedBook = catchAsyncErrors(async (req, res, next) => {
  const id = req.params?.borrowId; // could be borrowId OR bookId (fallback)
  const email = normalizeEmail(req.body?.email);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid borrow id", 400));
  }

  // 1) Try: treat id as Borrow _id (correct)
  let borrow = await Borrow.findById(id);

  // 2) Fallback: treat id as Book _id + email
  if (!borrow) {
    if (!email) {
      return next(
        new ErrorHandler(
          "Borrow record not found. If you are passing a bookId, include email in body.",
          404
        )
      );
    }

    const user = await User.findOne({ email }).select("_id");
    if (!user) return next(new ErrorHandler("User not found", 404));

    borrow = await Borrow.findOne({
      book: id, // here id is bookId
      "user.id": user._id,
      returned: false,
    });
  }

  if (!borrow) return next(new ErrorHandler("Borrow record not found", 404));

  if (borrow.returned) {
    return next(new ErrorHandler("This book is already returned", 400));
  }

  // 3) Mark returned + calculate fine (INR)
  const now = new Date();
  const fine = calculateFine(borrow.dueDate, now);

  borrow.returned = true;
  borrow.returnDate = now;
  borrow.fine = fine;
  await borrow.save();

  // 4) Increment inventory (atomic)
  const updatedBook = await Book.findByIdAndUpdate(
    borrow.book,
    { $inc: { quantity: 1 }, $set: { availability: true } },
    { new: true }
  );

  if (!updatedBook) return next(new ErrorHandler("Book not found", 404));

  return res.status(200).json({
    success: true,
    message: "Book returned successfully",
    fine: borrow.fine, // number (INR)
    fineInINR: formatINR(borrow.fine), // "₹10.00"
    borrow,
  });
});
