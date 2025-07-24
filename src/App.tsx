import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Spinner, Center } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (!user) {
    return (
      <Box bg="gray.50" minH="100vh" py={8}>
        <Login />
      </Box>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route 
          path="/" 
          element={
            user.role === 'admin' ? 
            <Navigate to="/admin" replace /> : 
            <Navigate to="/teacher" replace />
          } 
        />
        <Route 
          path="/admin" 
          element={
            user.role === 'admin' ? 
            <AdminDashboard /> : 
            <Navigate to="/teacher" replace />
          } 
        />
        <Route 
          path="/teacher" 
          element={
            user.role === 'teacher' ? 
            <TeacherDashboard /> : 
            <Navigate to="/admin" replace />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
