import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { FirebaseProvider } from './contexts/FirebaseContext';
import Header from './components/Header';
import Home from './pages/Home';
import FixedPrice from './pages/FixedPrice';
import DMPrice from './pages/DMPrice';
import DirectMessage from './components/DirectMessage';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Messages from './pages/Messages';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <FirebaseProvider>
        <DataProvider>
          <Router>
            <div className="min-h-screen bg-black">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/fixed-price" element={<FixedPrice />} />
              <Route path="/dm-price" element={<DMPrice />} />
              <Route path="/messages" element={<DirectMessage className="max-w-2xl mx-auto mt-8" />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/messages" 
                element={
                  <ProtectedRoute requireAdmin>
                    <Messages />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          </Router>
        </DataProvider>
      </FirebaseProvider>
    </AuthProvider>
  );
}

export default App;