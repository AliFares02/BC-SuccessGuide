function getSemesterThreeMthsBeforeReg() {
  const now = new Date();
  const year = now.getFullYear();

  const may26 = new Date(year, 4, 26);
  const oct27 = new Date(year, 9, 27);
  if (now >= may26 && now < oct27) {
    return `Fall ${year}`;
  } else {
    const springYear = now < may26 ? year : year + 1;
    return `Spring ${springYear}`;
  }
}

export const semesterInAdv = getSemesterThreeMthsBeforeReg().split(" ")[0];

export const semesterInAdvWithYr = getSemesterThreeMthsBeforeReg();
