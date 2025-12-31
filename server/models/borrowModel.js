import mongoose from "mongoose";

const borrowSchema = new mongoose.Schema(
  {
    user: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
    },

    price: {
      type: Number,
      required: true,
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    borrowDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    returned: {
      type: Boolean,
      default: false,
    },

    returnDate: {
      type: Date,
      default: null,
      required: function () {
        return this.returned === true;
      },
    },

    fine: {
      type: Number,
      default: 0,
    },

    notified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent same user borrowing same book twice while not returned
borrowSchema.index(
  { "user.id": 1, book: 1 },
  { unique: true, partialFilterExpression: { returned: false } }
);

export const Borrow = mongoose.model("Borrow", borrowSchema);
