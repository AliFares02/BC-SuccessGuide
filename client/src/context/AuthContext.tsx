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
  email: string;
  role: string;
  department: string;
};

export const AuthContextProvider = ({ children }: AuthProviderProps) => {
  // useReducer calls authReducer and authReducer returns the new state(with a new user field in this case), in the return line above, to the state object destructured from the hook below i.e const [ -> state, dispatch] = ..., then this new state object is passed to child components in the return statement below
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    tkFetchLoading: true,
  });

  //the main thing with adding the loading attribute is to make sure that any component that renders content based on the authContext state should check the loading value of the authcontext state and only render the content if the loading value is false else add some type of loading screen

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      const { email, role, department } = jwtDecode<JwtPayload>(token);
      dispatch({
        type: "LOGIN",
        payload: { access: token, email, role, department },
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
