import React, { useEffect, useState } from "react";
import useAuthContext from "../hooks/useAuthContext";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import { CgSpinner } from "react-icons/cg";
import { MdDeleteForever } from "react-icons/md";
import useLogout from "../hooks/useLogout";

interface StudentAccount {
  name: string;
  email: string;
  department: string;
  year: string;
}

interface UpdatedAccount {
  name?: string;
  email?: string;
  department?: string;
  year?: string;
  password?: string;
}

function AccountSettings() {
  const [studentAcctInfo, setStudentAcctInfo] = useState<StudentAccount | null>(
    null
  );
  const [updatedStudentAcctInfo, setUpdatedStudentAcctInfo] =
    useState<UpdatedAccount | null>(null);
  const [editAcctClicked, setEditAcctClicked] = useState(false);
  const [updatedStudentAccError, setUpdateStudentAccountError] = useState("");
  const [updateStudentLoading, setUpdateStudentLoading] = useState(false);
  const [deleteAccountPrompt, setDeleteAccountPrompt] = useState(false);
  const { user } = useAuthContext();
  const { logout } = useLogout();

  useEffect(() => {
    if (user) getStudentAccount();
  }, []);

  useEffect(() => {
    if (studentAcctInfo) {
      setUpdatedStudentAcctInfo({ ...studentAcctInfo, password: "" });
    }
  }, [studentAcctInfo]);
  async function getStudentAccount() {
    axios
      .get("http://localhost:5000/api/users/account", {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then((response) => setStudentAcctInfo(response.data))
      .catch((error) => toast.error(error.response.data.msg));
  }

  async function updateStudentAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUpdateStudentAccountError("");
    setUpdateStudentLoading(true);
    if (!updatedStudentAcctInfo || !studentAcctInfo) return;

    const parsedUpdates: UpdatedAccount = {};

    const original = {
      name: studentAcctInfo.name.trim(),
      email: studentAcctInfo.email.trim(),
      department: studentAcctInfo.department.trim(),
      year: studentAcctInfo.year.trim(),
    };

    const updated = {
      name: updatedStudentAcctInfo.name?.trim(),
      email: updatedStudentAcctInfo.email?.trim(),
      department: updatedStudentAcctInfo.department?.trim(),
      year: studentAcctInfo.year.trim(),
      password: updatedStudentAcctInfo.password?.trim(),
    };

    if (updated.name && updated.name !== original.name) {
      parsedUpdates.name = updated.name;
    }
    if (updated.email && updated.email !== original.email) {
      parsedUpdates.email = updated.email;
    }
    if (updated.department && updated.department !== original.department) {
      parsedUpdates.department = updated.department;
    }
    if (updated.year && updated.year !== original.year) {
      parsedUpdates.year = updated.year;
    }
    if (updated.password) {
      parsedUpdates.password = updated.password;
    }

    axios
      .patch(
        "http://localhost:5000/api/users/update-account",
        {
          updatedStudentAcctInfo,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        setStudentAcctInfo(response.data.student);
        setUpdateStudentLoading(false);
        toast.success(response.data.msg);
        setEditAcctClicked(false);
      })
      .catch((error) => {
        setUpdateStudentLoading(false);
        setUpdateStudentAccountError(error.response.data.msg);
        console.error(error);
      });
  }

  async function deleteStudentAccount() {
    axios
      .delete(`http://localhost:5000/api/users/delete-user/${user?._id}`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then(() => logout())
      .catch((error) => toast.error(error.response.data.msg));
  }

  return (
    <div className="account-settings-container">
      <p className="page-title">Account settings</p>
      <div className="student-account-info-container">
        <div className="account-info-form-wrapper">
          <FaEdit
            className="edit-account-settings-icon"
            onClick={() => setEditAcctClicked(true)}
          />
          <form
            onSubmit={(e) => updateStudentAccount(e)}
            className="account-info-form"
          >
            <label htmlFor="student-account-name">Name</label>
            {editAcctClicked ? (
              <input
                type="text"
                id="student-account-name"
                value={updatedStudentAcctInfo?.name}
                onChange={(e) =>
                  setUpdatedStudentAcctInfo((prev) => {
                    return {
                      ...prev,
                      name: e.target.value,
                    };
                  })
                }
              />
            ) : (
              <p>{studentAcctInfo?.name}</p>
            )}

            <label htmlFor="student-account-email">Email</label>
            {editAcctClicked ? (
              <input
                type="text"
                id="student-account-email"
                value={updatedStudentAcctInfo?.email}
                onChange={(e) =>
                  setUpdatedStudentAcctInfo((prev) => {
                    return {
                      ...prev,
                      email: e.target.value,
                    };
                  })
                }
              />
            ) : (
              <p>{studentAcctInfo?.email}</p>
            )}

            <label htmlFor="student-account-dept">Department</label>
            {editAcctClicked ? (
              <>
                <select
                  id="student-account-dept"
                  value={updatedStudentAcctInfo?.department}
                  onChange={(e) =>
                    setUpdatedStudentAcctInfo((prev) => {
                      return {
                        ...prev,
                        department: e.target.value,
                      };
                    })
                  }
                >
                  <option value="Communication">Communication</option>
                  <option value="Communication Sciences and Disorders">
                    Communication Sciences and Disorders
                  </option>
                  <option value="Africana Studies">Africana Studies</option>
                </select>
                <p style={{ color: "rgb(220, 53, 69)", fontSize: ".8rem" }}>
                  Warning: Changing departments will erase your course history
                </p>
              </>
            ) : (
              <p>{studentAcctInfo?.department}</p>
            )}

            <label htmlFor="student-account-year">Year</label>
            {editAcctClicked ? (
              <select
                value={updatedStudentAcctInfo?.year}
                onChange={(e) =>
                  setUpdatedStudentAcctInfo((prev) => {
                    return {
                      ...prev,
                      year: e.target.value,
                    };
                  })
                }
              >
                <option value="First">First</option>
                <option value="Second">Second</option>
                <option value="Third">Third</option>
                <option value="Fourth">Fourth</option>
              </select>
            ) : (
              <p>{studentAcctInfo?.year}</p>
            )}

            {editAcctClicked ? (
              <>
                <label htmlFor="student-account-change-pwd">New password</label>
                <input
                  type="text"
                  value={updatedStudentAcctInfo?.password}
                  onChange={(e) =>
                    setUpdatedStudentAcctInfo((prev) => {
                      return {
                        ...prev,
                        password: e.target.value,
                      };
                    })
                  }
                />
              </>
            ) : (
              <label htmlFor="student-account-pwd">
                Password{" "}
                <span>
                  &#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;
                </span>
              </label>
            )}
            {updatedStudentAccError && (
              <div className="error">{updatedStudentAccError}</div>
            )}

            {editAcctClicked && (
              <div className="btn-wrapper">
                <button
                  type="submit"
                  className="save-account-changes-btn"
                  disabled={
                    JSON.stringify({ ...studentAcctInfo, password: "" }) ===
                      JSON.stringify(updatedStudentAcctInfo) ||
                    (JSON.stringify({ ...studentAcctInfo, password: "" }) ===
                      JSON.stringify(updatedStudentAcctInfo) &&
                      !updatedStudentAcctInfo?.password?.trim()) ||
                    updateStudentLoading
                  }
                >
                  {updateStudentLoading ? (
                    <CgSpinner className="spinner" />
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  type="button"
                  className="cancel-account-changes-btn"
                  disabled={updateStudentLoading}
                  onClick={() => {
                    setUpdatedStudentAcctInfo({
                      ...studentAcctInfo,
                      password: "",
                    });
                    setEditAcctClicked(false);
                    setUpdateStudentAccountError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
        {deleteAccountPrompt ? (
          <div className="delete-acc-prompt-wrapper">
            <p>Are you sure you want to delete your account?</p>
            <button className="confirm-del-acc" onClick={deleteStudentAccount}>
              Yes
            </button>
            <button
              className="deny-del-acc"
              onClick={() => setDeleteAccountPrompt(false)}
            >
              No
            </button>
          </div>
        ) : (
          <button
            className="delete-acct-btn"
            onClick={() => setDeleteAccountPrompt(true)}
          >
            <MdDeleteForever className="delete-acc-icon" />
            Delete account
          </button>
        )}
      </div>
    </div>
  );
}

export default AccountSettings;
