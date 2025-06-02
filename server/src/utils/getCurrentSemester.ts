export default function getCurrentSemesterWithYear(): string {
  const now = new Date();
  const year = now.getFullYear();

  const springStart = new Date(year, 0, 15);
  const springEnd = new Date(year, 4, 31);

  const fallStart = new Date(year, 7, 15);
  const fallEnd = new Date(year, 11, 31);

  if (now >= springStart && now <= springEnd) {
    return `Spring ${year}`;
  } else if (now >= fallStart && now <= fallEnd) {
    return `Fall ${year}`;
  } else if (now < springStart) {
    return `Spring ${year}`;
  } else {
    return `Fall ${year}`;
  }
}
