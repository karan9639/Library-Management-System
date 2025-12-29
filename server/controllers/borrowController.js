import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Borrow } from "../models/borrowModel.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js"
import { Book } from "../models/bookModel.js";
import { User } from "../models/userModel.js";

export const borrowedBooks = catchAsyncErrors(async (req, res, next) => { });

export const recordBorrowedBook = catchAsyncErrors(async (req, res, next) => { 
    const { id } = req.params;
    const { email } = req.body;

    const book = await Book.findById(id);
    if (!book) {
        return next(new ErrorHandler("Book not found", 404));
    }
    const user = await User.findOne({ email: email });
    if(!user){
        return next(new ErrorHandler("User not found", 404));
    }
    if (book.quantity < 1) {
        return next(new ErrorHandler("Book is currently unavailable", 400));
    }
    
});

export const getBorrowedBooksForAdmin = catchAsyncErrors(async (req, res, next) => { });

export const returnBorrowedBook = catchAsyncErrors(async (req, res, next) => { });