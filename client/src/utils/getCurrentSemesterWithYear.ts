const semesterOrder = ["Spring", "Fall"];

const yearToSemesterCount: Record<string, number> = {
  First: 2,
  Second: 4,
  Third: 6,
  Fourth: 8,
};

export function getCurrentSemesterWithYear(): string {
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

export function generateAvailableSemesters(
  currentSemesterWithYear: string,
  academicStanding: "First" | "Second" | "Third" | "Fourth"
): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const totalSemesters = yearToSemesterCount[academicStanding];

  const yearsCompleted = {
    First: 0,
    Second: 1,
    Third: 2,
    Fourth: 3,
  }[academicStanding];

  let year = currentYear - yearsCompleted;
  let index = semesterOrder.indexOf("Fall");

  const semesters: string[] = [];
  for (let i = 0; i < totalSemesters; i++) {
    const semester = semesterOrder[index % 2];
    semesters.push(`${semester} ${year}`);
    if (semester === "Spring") year++;
    index++;
  }

  const [currentSem, currentSemYearStr] = currentSemesterWithYear.split(" ");
  const currentSemYear = parseInt(currentSemYearStr);
  const currentSemIndex = semesterOrder.indexOf(currentSem);

  return semesters.filter((s) => {
    const [sem, yrStr] = s.split(" ");
    const yr = parseInt(yrStr);
    const semIndex = semesterOrder.indexOf(sem);
    return (
      yr < currentSemYear ||
      (yr === currentSemYear && semIndex <= currentSemIndex)
    );
  });
}
