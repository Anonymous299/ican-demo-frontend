import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Spacer,
  Button,
  Text,
  Container,
  Image,
  HStack,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <Box minH="100vh" bg="green.50" backgroundImage="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)">
      <Box 
        bg="white" 
        shadow="lg" 
        px={4} 
        py={3}
        borderBottom="3px solid"
        borderBottomColor="green.400"
        backgroundImage="linear-gradient(to right, #ffffff 0%, #f0fdf4 100%)"
      >
        <Container maxW="7xl">
          <Flex align="center">
            <HStack gap={3}>
              <Box 
                p={2} 
                bg="green.100" 
                borderRadius="lg"
                boxShadow="0 2px 4px rgba(0,0,0,0.1)"
              >
                <Image 
                  src="/logo.jpeg" 
                  alt="e-Vriddhi Logo" 
                  boxSize="40px"
                  objectFit="contain"
                  borderRadius="md"
                />
              </Box>
              <Heading 
                size="md" 
                color="green.700"
                fontWeight="bold"
              >
                e-Vriddhi
              </Heading>
            </HStack>
            
            <Spacer />
            
            <Flex align="center" gap={4}>
              <Box 
                px={3} 
                py={1} 
                bg="teal.50" 
                borderRadius="full"
                border="1px solid"
                borderColor="teal.200"
              >
                <Text fontSize="sm" color="teal.700" fontWeight="medium">
                  {user?.role === 'admin' ? '👨‍💼 Admin' : 
                   user?.role === 'teacher' ? '👩‍🏫 Teacher' :
                   user?.role === 'parent' ? '👪 Parent' :
                   user?.role === 'student' ? '🎓 Student' : user?.role}
                </Text>
              </Box>
              <Text fontSize="sm" color="gray.600">
                {user?.email}
              </Text>
              <Button 
                size="sm" 
                colorScheme="red"
                variant="solid"
                onClick={logout}
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
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