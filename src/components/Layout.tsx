import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Spacer,
  Button,
  Text,
  Container,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" shadow="sm" px={4} py={3}>
        <Container maxW="7xl">
          <Flex align="center">
            <Heading size="md" color="blue.600">
              e-Vriddhi
            </Heading>
            
            <Spacer />
            
            <Flex align="center" gap={4}>
              <Text fontSize="sm" color="gray.600">
                Logged in as: <strong>{user?.role === 'admin' ? 'Admin' : 'Teacher'}</strong>
              </Text>
              <Text fontSize="sm" color="gray.500">
                ({user?.email})
              </Text>
              <Button size="sm" variant="outline" onClick={logout}>
                Logout
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Box>
      
      <Container maxW="7xl" py={6}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;