import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Borrow } from "../models/borrowModel.js";
import { Book } from "../models/bookModel.js";
import { User } from "../models/userModel.js";

/**
 * Helpers
 */
const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const addDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

// Optional fine (set env FINE_PER_DAY=10 etc). Default 0 = no fine.
const FINE_PER_DAY = Number(process.env.FINE_PER_DAY || 0);
const calcFine = (dueDate, returnDate) => {
  if (!FINE_PER_DAY) return 0;
  const lateMs = new Date(returnDate).getTime() - new Date(dueDate).getTime();
  if (lateMs <= 0) return 0;
  const daysLate = Math.ceil(lateMs / (24 * 60 * 60 * 1000));
  return daysLate * FINE_PER_DAY;
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
 * Admin records a borrow for a user by email
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
    await Book.updateOne(
      { _id: book._id },
      { $set: { availability: shouldBeAvailable } }
    );
    book.availability = shouldBeAvailable;
  }

  // 5) Create borrow record (returnDate must be null at first)
  const dueDate = addDays(7);

  const borrow = await Borrow.create({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    book: book._id,
    price: book.price,
    borrowDate: new Date(),
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
 * Admin view of all borrowed books
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
 * Admin marks borrow as returned + increases book quantity
 */
export const returnBorrowedBook = catchAsyncErrors(async (req, res, next) => {
  const borrowId = req.params?.borrowId;

  if (!mongoose.Types.ObjectId.isValid(borrowId)) {
    return next(new ErrorHandler("Invalid borrow id", 400));
  }

  // 1) Find borrow
  const borrow = await Borrow.findById(borrowId);
  if (!borrow) return next(new ErrorHandler("Borrow record not found", 404));

  if (borrow.returned) {
    return next(new ErrorHandler("This book is already returned", 400));
  }

  // 2) Mark returned
  const now = new Date();
  borrow.returned = true;
  borrow.returnDate = now;
  borrow.fine = calcFine(borrow.dueDate, now);
  await borrow.save();

  // 3) Increment inventory
  const book = await Book.findById(borrow.book);
  if (!book) return next(new ErrorHandler("Book not found", 404));

  book.quantity += 1;
  book.availability = true;
  await book.save();

  return res.status(200).json({
    success: true,
    message: "Book returned successfully",
    fine: borrow.fine,
  });
});
