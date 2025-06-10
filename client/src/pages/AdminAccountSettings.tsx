import { API_BASE_URL } from "../api/config";
import React, { useEffect, useState } from "react";
import useAuthContext from "../hooks/useAuthContext";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import { CgSpinner } from "react-icons/cg";
import { MdDeleteForever } from "react-icons/md";
import useLogout from "../hooks/useLogout";

interface AdminAccount {
  email: string;
}

interface UpdatedAccount {
  email?: string;
  password?: string;
}

function AccountAccountSettings() {
  const [adminAcctInfo, setAdminAcctInfo] = useState<AdminAccount | null>(null);
  const [updatedAdminAcctInfo, setUpdatedAdminAcctInfo] =
    useState<UpdatedAccount | null>(null);
  const [editAcctClicked, setEditAcctClicked] = useState(false);
  const [updateAdminAccError, setUpdateAdminAccError] = useState("");
  const [updateAdminLoading, setUpdateAdminLoading] = useState(false);
  const [deleteAccountPrompt, setDeleteAccountPrompt] = useState(false);
  const { user } = useAuthContext();
  const { logout } = useLogout();

  useEffect(() => {
    if (user) getAdminAccount();
  }, []);

  useEffect(() => {
    if (adminAcctInfo) {
      setUpdatedAdminAcctInfo({ ...adminAcctInfo, password: "" });
    }
  }, [adminAcctInfo]);
  async function getAdminAccount() {
    axios
      .get(`${API_BASE_URL}/api/admin/account`, {
        headers: {
          Authorization: `Bearer ${user?.access}`,
        },
      })
      .then((response) => setAdminAcctInfo(response.data))
      .catch((error) => toast.error(error.response.data.msg));
  }

  async function updateAdminAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUpdateAdminAccError("");
    setUpdateAdminLoading(true);
    if (!updatedAdminAcctInfo || !adminAcctInfo) return;

    const parsedUpdates: UpdatedAccount = {};

    const original = {
      email: adminAcctInfo.email.trim(),
    };

    const updated = {
      email: updatedAdminAcctInfo.email?.trim(),
      password: updatedAdminAcctInfo.password?.trim(),
    };

    if (updated.email && updated.email !== original.email) {
      parsedUpdates.email = updated.email;
    }
    if (updated.password) {
      parsedUpdates.password = updated.password;
    }

    axios
      .patch(
        `${API_BASE_URL}/api/admin/update-account`,
        {
          updatedAdminAcctInfo,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
      )
      .then((response) => {
        setAdminAcctInfo(response.data.admin);
        setUpdateAdminLoading(false);
        toast.success(response.data.msg);
        setEditAcctClicked(false);
      })
      .catch((error) => {
        setUpdateAdminLoading(false);
        setUpdateAdminAccError(error.response.data.msg);
      });
  }

  async function deleteStudentAccount() {
    axios
      .delete(`${API_BASE_URL}/api/users/delete-user/${user?._id}`, {
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
          <form onSubmit={updateAdminAccount} className="account-info-form">
            <label htmlFor="student-account-email">Email</label>
            {editAcctClicked ? (
              <input
                type="text"
                id="student-account-email"
                value={updatedAdminAcctInfo?.email}
                onChange={(e) =>
                  setUpdatedAdminAcctInfo((prev) => {
                    return {
                      ...prev,
                      email: e.target.value,
                    };
                  })
                }
              />
            ) : (
              <p>{adminAcctInfo?.email}</p>
            )}

            {editAcctClicked ? (
              <>
                <label htmlFor="student-account-change-pwd">New password</label>
                <input
                  type="text"
                  value={updatedAdminAcctInfo?.password}
                  onChange={(e) =>
                    setUpdatedAdminAcctInfo((prev) => {
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
            {updateAdminAccError && (
              <div className="error">{updateAdminAccError}</div>
            )}

            {editAcctClicked && (
              <div className="btn-wrapper">
                <button
                  type="submit"
                  className="save-account-changes-btn"
                  disabled={
                    JSON.stringify({ ...adminAcctInfo, password: "" }) ===
                      JSON.stringify(updatedAdminAcctInfo) ||
                    (JSON.stringify({ ...adminAcctInfo, password: "" }) ===
                      JSON.stringify(updatedAdminAcctInfo) &&
                      !updatedAdminAcctInfo?.password?.trim()) ||
                    updateAdminLoading
                  }
                >
                  {updateAdminLoading ? (
                    <CgSpinner className="spinner" />
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  type="button"
                  className="cancel-account-changes-btn"
                  disabled={updateAdminLoading}
                  onClick={() => {
                    setUpdatedAdminAcctInfo({
                      ...adminAcctInfo,
                      password: "",
                    });
                    setEditAcctClicked(false);
                    setUpdateAdminAccError("");
                    setUpdateAdminLoading(false);
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

export default AccountAccountSettings;
