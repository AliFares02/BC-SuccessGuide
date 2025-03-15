import React from "react";

function Courses() {
  return (
    <div className="courses-container">
      <h1 className="page-title">My Courses</h1>
      <div className="courses-tables-container">
        <h2 className="page-sub-title">Past courses</h2>
        <table className="past-courses-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Grade</th>
              <th>Semester</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ENGL 1000</td>
              <td>A</td>
              <td>Fall 2022</td>
            </tr>
            <tr>
              <td>COMM 1200</td>
              <td>A-</td>
              <td>Spring 2023</td>
            </tr>
            <tr>
              <td>COMM 1100</td>
              <td>B+</td>
              <td>Spring 2023</td>
            </tr>
          </tbody>
        </table>
        <div className="current-gpa-container">
          <p>
            Current GPA: <b>3.7</b>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Courses;
