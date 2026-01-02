import cron from "node-cron";
import { Borrow } from "../models/borrowModel.js";
import { User } from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";

export const notifyUsers = () => {
  cron.schedule("*/5 * * * * *", async () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const borrowers = await Borrow.find({
        dueDate: {
          $lt: oneDayAgo,
        },
        returnDate: null,
        notified: false,
      });
      for (const element of borrowers) {
        if (element.user && element.user.email) {
          const user = await User.findById(element.user.id);
          sendEmail({
            to: element.user.email,
            subject: "Book Return Reminder",
            html: `<h1>Book Return Reminder</h1>
        <p>Dear ${element.user.name},</p>
        <p>This is a reminder that your borrowed book is overdue.</p>
        <p>Please return it as soon as possible.</p>
        <p>Thank you!</p>`,
          });
          element.notified = true;
          await element.save();
          console.log("email send");
        }
      }
    } catch (error) {
      console.error("Some error occured while notifying users.", error);
    }
  });
};
