import { useState, useEffect } from "react";
import getRegistrationDateIfWithin3Months from "../utils/getRegistrationDateThreeMthsInAdvanced";
function NotificationComponent({ onClose }: { onClose: () => void }) {
  const [isClosing, setIsClosing] = useState(false);

  function handleClose() {
    setIsClosing(true);
  }

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);
  return (
    <div
      className={`notification-banner ${isClosing ? "close" : ""}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <svg
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12" y2="8"></line>
      </svg>

      <div className="notification-message">
        Course enrollment opens{" "}
        <strong>{getRegistrationDateIfWithin3Months()}</strong>. Check your
        specific appointment{" "}
        <a
          href="https://cssa.cunyfirst.cuny.edu/psc/cnycsprd_5/EMPLOYEE/SA/c/SSR_STUDENT_FL.SSR_MD_SP_FL.GBL?Action=U&MD=Y&GMenu=SSR_STUDENT_FL&GComp=SSR_START_PAGE_FL&GPage=SSR_START_PAGE_FL&scname=CS_SSR_MANAGE_CLASSES_NAV"
          target="_blank"
        >
          here
        </a>{" "}
        under "Enrollment Appointments," and view the recommended course plan
        for next semester{" "}
        <a href="http://localhost:5173/courses#recommended-course-structure-section">
          here
        </a>
        .
      </div>

      <button
        className="notification-close"
        aria-label="Close notification"
        onClick={handleClose}
      >
        &times;
      </button>
    </div>
  );
}

export default NotificationComponent;
