// The actual Context object lives in its own tiny file, separate from the
// AuthProvider component in AuthContext.jsx. This split exists because of a
// Vite/React Fast Refresh quirk: a file that exports both a component and a
// non-component value can lose hot-reload state; keeping createContext() in
// its own file keeps Fast Refresh working smoothly for AuthContext.jsx.
import { createContext } from "react";

// createContext() makes a "channel" that a Provider can broadcast a value on
// and any descendant component can tune into with useContext(AuthContext),
// without the value being passed down manually through every component in
// between (see AuthContext.jsx for what gets broadcast).
export const AuthContext = createContext();
