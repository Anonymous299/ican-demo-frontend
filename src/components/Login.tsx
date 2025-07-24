import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Input,
  VStack,
  Text,
  Heading,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const demoCredentials = {
    admin: { email: 'admin@gmail.com', password: '12345' },
    teacher: { email: 'teacher@gmail.com', password: '12345' },
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    const credentials = demoCredentials[role as keyof typeof demoCredentials];
    setEmail(credentials.email);
    setPassword(credentials.password);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    handleRoleChange('admin');
  }, []);

  return (
    <Container maxW="md" centerContent>
      <Box
        w="100%"
        p={8}
        mt={8}
        boxShadow="lg"
        borderRadius="md"
        bg="white"
      >
        <VStack gap={6}>
          <Heading size="lg" color="blue.600">
            Ican Web Portal Demo
          </Heading>
          
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Welcome to the demo! Select a role below to auto-fill credentials.
          </Text>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack gap={4}>
              <Box w="100%">
                <Text mb={2} fontWeight="medium">Demo Role</Text>
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '16px',
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                </select>
              </Box>

              <Box w="100%">
                <Text mb={2} fontWeight="medium">Email</Text>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Box>

              <Box w="100%">
                <Text mb={2} fontWeight="medium">Password</Text>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Box>

              {error && (
                <Box bg="red.50" color="red.600" p={3} borderRadius="md" w="100%">
                  {error}
                </Box>
              )}

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                loading={isLoading}
              >
                Sign In
              </Button>
            </VStack>
          </form>

          <Box textAlign="center" fontSize="sm" color="gray.600">
            <Text>Demo Credentials:</Text>
            <Text>Admin: admin@gmail.com / 12345</Text>
            <Text>Teacher: teacher@gmail.com / 12345</Text>
          </Box>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login;