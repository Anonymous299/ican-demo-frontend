import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Spinner, Center } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';

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

  const getDefaultRoute = () => {
    switch (user.role) {
      case 'admin': return '/admin';
      case 'teacher': return '/teacher';
      case 'student': return '/student';
      case 'parent': return '/parent';
      default: return '/admin';
    }
  };

  return (
    <Layout>
      <Routes>
        <Route 
          path="/" 
          element={<Navigate to={getDefaultRoute()} replace />} 
        />
        <Route 
          path="/admin" 
          element={
            user.role === 'admin' ? 
            <AdminDashboard /> : 
            <Navigate to={getDefaultRoute()} replace />
          } 
        />
        <Route 
          path="/teacher" 
          element={
            user.role === 'teacher' ? 
            <TeacherDashboard /> : 
            <Navigate to={getDefaultRoute()} replace />
          } 
        />
        <Route 
          path="/student" 
          element={
            user.role === 'student' ? 
            <StudentDashboard /> : 
            <Navigate to={getDefaultRoute()} replace />
          } 
        />
        <Route 
          path="/parent" 
          element={
            user.role === 'parent' ? 
            <ParentDashboard /> : 
            <Navigate to={getDefaultRoute()} replace />
          } 
        />
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
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
