import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "Attempting to access auth context outside of auth context provider"
    );
  }
  return context;
}

export default useAuthContext;
