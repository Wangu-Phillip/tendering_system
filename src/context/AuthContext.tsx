import { createContext, useContext, ReactNode } from "react";

export type UserRole = "admin" | "vendor" | "buyer";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: UserRole;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  userRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
  currentUser,
  loading,
  userRole,
}: {
  children: ReactNode;
  currentUser: AuthUser | null;
  loading: boolean;
  userRole?: UserRole | null;
}) => {
  return (
    <AuthContext.Provider
      value={{ currentUser, loading, userRole: userRole || null }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
