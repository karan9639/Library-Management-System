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

/**
 * GET /api/v1/borrow/me
 * Borrow history for logged-in user
 */
export const borrowedBooks = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) return next(new ErrorHandler("Unauthorized", 401));

  const borrows = await Borrow.find({ userId })
    .populate("bookId", "title author price")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: borrows.length,
    borrows,
  });
});

/**
 * POST /api/v1/borrow/:id
 * Admin (or librarian) records a borrow for a user by email
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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1) Find book
    const book = await Book.findById(bookId).session(session);
    if (!book) throw new ErrorHandler("Book not found", 404);

    // 2) Find user
    const user = await User.findOne({ email }).session(session);
    if (!user) throw new ErrorHandler("User not found", 404);

    // 3) Check availability
    if (book.quantity < 1) {
      throw new ErrorHandler("Book is currently unavailable", 400);
    }

    // 4) Prevent double borrow
    const alreadyBorrowed = await Borrow.findOne({
      userId: user._id,
      bookId: book._id,
      returned: false,
    }).session(session);

    if (alreadyBorrowed) {
      throw new ErrorHandler("User has already borrowed this book", 400);
    }

    // 5) Update inventory
    book.quantity -= 1;
    book.availability = book.quantity > 0; // ✅ boolean per your schema
    await book.save({ session });

    // 6) Create borrow record
    const dueDate = addDays(7);

    const borrowDoc = await Borrow.create(
      [
        {
          userId: user._id,
          bookId: book._id,
          price: book.price,
          borrowDate: new Date(),
          dueDate,
          returned: false,
        },
      ],
      { session }
    );

    // 7) (Optional) Store in user document if your schema supports it
    // If you have user.borrowedBooks array, keep it in sync:
    if (Array.isArray(user.borrowedBooks)) {
      user.borrowedBooks.push({
        book: book._id,
        bookTitle: book.title,
        borrowDate: new Date(),
        dueDate,
      });
      await user.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      borrow: borrowDoc[0],
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(
      err instanceof ErrorHandler ? err : new ErrorHandler(err.message, 500)
    );
  }
});

/**
 * GET /api/v1/borrow/admin/all
 * Admin view of all borrowed books (filter/sort)
 * Query:
 *  - returned=true/false
 *  - q=search (email or book title)
 */
export const getBorrowedBooksForAdmin = catchAsyncErrors(
  async (req, res, next) => {
    const returned =
      req.query.returned === undefined
        ? undefined
        : req.query.returned === "true";
    const q = (req.query.q || "").trim();

    const filter = {};
    if (returned !== undefined) filter.returned = returned;

    // If you store denormalized fields differently, adjust this part.
    // With populate, simple regex on book title isn't possible directly without aggregation,
    // so we search user email using User lookup or keep denormalized fields in Borrow model.
    // We'll support search on user email via populate + post-filter fallback:
    const borrows = await Borrow.find(filter)
      .populate("userId", "name email")
      .populate("bookId", "title author price")
      .sort({ createdAt: -1 });

    const filtered = q
      ? borrows.filter((b) => {
          const email = b.userId?.email || "";
          const name = b.userId?.name || "";
          const title = b.bookId?.title || "";
          return (
            email.toLowerCase().includes(q.toLowerCase()) ||
            name.toLowerCase().includes(q.toLowerCase()) ||
            title.toLowerCase().includes(q.toLowerCase())
          );
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
 * PUT /api/v1/borrow/return/:borrowId
 * Mark borrow as returned + increase book quantity
 */
export const returnBorrowedBook = catchAsyncErrors(async (req, res, next) => {
  const borrowId = req.params?.borrowId;

  if (!mongoose.Types.ObjectId.isValid(borrowId)) {
    return next(new ErrorHandler("Invalid borrow id", 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const borrow = await Borrow.findById(borrowId).session(session);
    if (!borrow) throw new ErrorHandler("Borrow record not found", 404);

    if (borrow.returned) {
      throw new ErrorHandler("This book is already returned", 400);
    }

    const book = await Book.findById(borrow.bookId).session(session);
    if (!book) throw new ErrorHandler("Book not found", 404);

    // Update borrow
    borrow.returned = true;
    borrow.returnDate = new Date();
    await borrow.save({ session });

    // Update inventory
    book.quantity += 1;
    book.availability = true;
    await book.save({ session });

    // (Optional) Update user's borrowedBooks array if you store it
    const user = await User.findById(borrow.userId).session(session);
    if (user && Array.isArray(user.borrowedBooks)) {
      user.borrowedBooks = user.borrowedBooks.map((item) => {
        if (String(item.book) === String(book._id) && !item.returnDate) {
          return { ...(item.toObject?.() ?? item), returnDate: new Date() };
        }
        return item;
      });
      await user.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Book returned successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(
      err instanceof ErrorHandler ? err : new ErrorHandler(err.message, 500)
    );
  }
});
