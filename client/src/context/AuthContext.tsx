import { createContext, useReducer, Dispatch, ReactNode } from "react";

type User = {
  name: string;
  email: string;
  access: string;
};

type AuthState = {
  user: User | null;
};

type AuthAction = { type: "LOGIN"; payload: User } | { type: "LOGOUT" };

type AuthContextType = {
  user: User | null;
  dispatch: Dispatch<AuthAction>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const authReducer = (state: AuthState, action: AuthAction) => {
  switch (action.type) {
    case "LOGIN":
      return { user: action.payload };
    case "LOGOUT":
      return { user: null };
    default:
      return state;
  }
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContextProvider = ({ children }: AuthProviderProps) => {
  // userReducer calls authReducer and authReducer returns the new state(with a new user field in this case), in the return line above, to the state object destructured from the hook below i.e const [ -> state, dispatch] = ..., then this new state object is passed to child components in the return statement below
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
  });

  console.log("authcontext state change: ", state);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
