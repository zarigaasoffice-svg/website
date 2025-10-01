import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type Role = "user" | "admin" | "owner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: Role | null;
  isAdmin: boolean;
  isOwner: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role | null>(null);

  // Function to fetch and update user role
  const updateUserRole = async (uid: string) => {
    console.log('Fetching user role for:', uid);
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const role = snap.data()?.role || 'user';
      console.log('User role from DB:', role);
      setUserRole(role);
      return role;
    }
    console.log('No user document found, defaulting to user role');
    return 'user';
  };

  // Firestore sync function
  const createOrUpdateUserDoc = async (firebaseUser: User) => {
    if (!firebaseUser) return;

    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      // Create new user document
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || "",
        role: "user", // default role
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        disabled: false,
      });
      setUserRole("user");
    } else {
      // Update last login and get current role
      const userData = snap.data();
      setUserRole(userData.role as Role);
      
      await setDoc(
        userRef,
        {
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Fetch user role when auth state changes
          const userRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(userRef);
          
          if (snap.exists()) {
            const role = snap.data()?.role || 'user';
            setUserRole(role);
            console.log('User role:', role); // Debug log
          } else {
            // Create new user document if it doesn't exist
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "",
              role: "user",
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp()
            });
            setUserRole("user");
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole("user");
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Role check computations
  const isAdmin = userRole === "admin" || userRole === "owner";
  const isOwner = userRole === "owner";

  console.log('Auth state computed:', { userRole, isAdmin, isOwner });

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // After successful sign in, check and update user role
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          role: 'user',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
        setUserRole('user');
      } else {
        const role = userDoc.data()?.role || 'user';
        setUserRole(role);
        console.log('User signed in with role:', role); // Debug log
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with name
      await updateProfile(user, { displayName: name });

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        email,
        name,
        role: 'user',
        createdAt: new Date().toISOString()
      });

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Error signing out:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    userRole,
    isAdmin: userRole === 'admin' || userRole === 'owner',
    isOwner: userRole === 'owner',
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}