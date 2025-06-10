export default function getRegistrationDateIfWithin3Months(): string | null {
  const now = new Date();
  const year = now.getFullYear();

  const fallRegDate = new Date(year, 2, 31);
  const springRegDate = new Date(year, 9, 28);

  const threeMonthsBeforeFall = new Date(fallRegDate);
  threeMonthsBeforeFall.setMonth(threeMonthsBeforeFall.getMonth() - 3);

  const threeMonthsBeforeSpring = new Date(springRegDate);
  threeMonthsBeforeSpring.setMonth(threeMonthsBeforeSpring.getMonth() - 3);

  if (now >= threeMonthsBeforeFall && now <= fallRegDate) {
    return "March 31st";
  } else if (now >= threeMonthsBeforeSpring && now <= springRegDate) {
    return "October 28th";
  } else {
    return null;
  }
}
