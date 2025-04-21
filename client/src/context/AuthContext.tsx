import {
  createContext,
  useReducer,
  Dispatch,
  ReactNode,
  useEffect,
} from "react";

type AuthUser = {
  access: string;
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

export const AuthContextProvider = ({ children }: AuthProviderProps) => {
  // userReducer calls authReducer and authReducer returns the new state(with a new user field in this case), in the return line above, to the state object destructured from the hook below i.e const [ -> state, dispatch] = ..., then this new state object is passed to child components in the return statement below
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    tkFetchLoading: true,
  });

  //the main thing with adding the loading attribute is to make sure that any component that renders content based on the authContext state should check the loading value of the authcontext state and only render the content if the loading value is false else add some type of loading screen

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      dispatch({ type: "LOGIN", payload: { access: token } });
    } else {
      dispatch({ type: "AUTH_READY" });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
