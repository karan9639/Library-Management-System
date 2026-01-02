// utils/fineCalculator.js

export const calculateFine = (dueDate, returnDate = new Date()) => {
  const due = new Date(dueDate).getTime();
  const ret = new Date(returnDate).getTime();

  if (Number.isNaN(due) || Number.isNaN(ret)) return 0;
  if (ret <= due) return 0;

  // Read env INSIDE the function so it's never "stuck" as 0
  const finePerHour = Number(process.env.FINE_PER_HOUR || 0);
  const finePerDay = Number(process.env.FINE_PER_DAY || 0);

  const lateMs = ret - due;

  if (finePerHour > 0) {
    const lateHours = Math.ceil(lateMs / (1000 * 60 * 60));
    return Math.round(lateHours * finePerHour * 100) / 100; // INR
  }

  if (finePerDay > 0) {
    const lateDays = Math.ceil(lateMs / (1000 * 60 * 60 * 24));
    return Math.round(lateDays * finePerDay * 100) / 100; // INR
  }

  return 0;
};

export const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(amount || 0));
