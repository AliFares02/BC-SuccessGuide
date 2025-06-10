import { jwtDecode } from "jwt-decode";
import {
  createContext,
  Dispatch,
  ReactNode,
  useEffect,
  useReducer,
} from "react";

type AuthUser = {
  access: string;
  _id: string;
  email: string;
  role: string;
  department: string;
};

type AuthState = {
  user: AuthUser | null;
  tkFetchLoading: boolean;
};

type AuthAction =
  | { type: "LOGIN"; payload: AuthUser }
  | { type: "LOGOUT" }
  | { type: "AUTH_READY" };

type AuthContextType = {
  user: AuthUser | null;
  tkFetchLoading: boolean;
  dispatch: Dispatch<AuthAction>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const authReducer = (state: AuthState, action: AuthAction) => {
  switch (action.type) {
    case "LOGIN":
      return { user: action.payload, tkFetchLoading: false };
    case "LOGOUT":
      return { user: null, tkFetchLoading: false };
    case "AUTH_READY":
      return {
        ...state,
        tkFetchLoading: false,
      };
    default:
      return state;
  }
};

type AuthProviderProps = {
  children: ReactNode;
};

type JwtPayload = {
  _id: string;
  email: string;
  role: string;
  department: string;
};

export const AuthContextProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    tkFetchLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      const { email, _id, role, department } = jwtDecode<JwtPayload>(token);
      dispatch({
        type: "LOGIN",
        payload: { access: token, _id, email, role, department },
      });
    } else {
      dispatch({ type: "AUTH_READY" });
    }
  }, []);

  if (state.tkFetchLoading) {
    return <div className="splash-screen"></div>;
  }

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
