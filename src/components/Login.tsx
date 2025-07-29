import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Input,
  VStack,
  Text,
  Heading,
  Image,
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
    <Box 
      minH="100vh" 
      backgroundImage="linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxW="md" centerContent>
        <Box
          w="100%"
          p={8}
          boxShadow="2xl"
          borderRadius="2xl"
          bg="white"
          border="2px solid"
          borderColor="green.200"
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="-50px"
            right="-50px"
            w="150px"
            h="150px"
            bg="orange.100"
            borderRadius="full"
            opacity="0.3"
          />
          <Box
            position="absolute"
            bottom="-30px"
            left="-30px"
            w="100px"
            h="100px"
            bg="teal.100"
            borderRadius="full"
            opacity="0.3"
          />
          <VStack gap={6} position="relative">
            <Box
              p={3}
              bg="gradient"
              backgroundImage="linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
              borderRadius="full"
              boxShadow="lg"
            >
              <Image 
                src="/logo.jpeg" 
                alt="e-Vriddhi Logo" 
                boxSize="80px"
                objectFit="contain"
                borderRadius="full"
                border="4px solid white"
              />
            </Box>
            <Heading 
              size="lg" 
              bgGradient="linear(to-r, green.600, teal.500)"
              bgClip="text"
              fontWeight="bold"
            >
              e-Vriddhi
            </Heading>
            
            <Text fontSize="sm" color="gray.700" textAlign="center" fontWeight="medium">
              Welcome to the demo! Select a role below to auto-fill credentials.
            </Text>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack gap={4}>
              <Box w="100%">
                <Text mb={2} fontWeight="bold" color="green.700">Demo Role</Text>
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '2px solid #86efac',
                    fontSize: '16px',
                    backgroundColor: '#f0fdf4',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                  onBlur={(e) => e.target.style.borderColor = '#86efac'}
                >
                  <option value="admin">👨‍💼 Admin</option>
                  <option value="teacher">👩‍🏫 Teacher</option>
                </select>
              </Box>

              <Box w="100%">
                <Text mb={2} fontWeight="bold" color="green.700">Email</Text>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  borderWidth="2px"
                  borderColor="green.200"
                  _hover={{ borderColor: 'green.300' }}
                  _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px #22c55e' }}
                  bg="green.50"
                  fontSize="16px"
                  py={5}
                />
              </Box>

              <Box w="100%">
                <Text mb={2} fontWeight="bold" color="green.700">Password</Text>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  borderWidth="2px"
                  borderColor="green.200"
                  _hover={{ borderColor: 'green.300' }}
                  _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px #22c55e' }}
                  bg="green.50"
                  fontSize="16px"
                  py={5}
                />
              </Box>

              {error && (
                <Box 
                  bg="red.50" 
                  color="red.600" 
                  p={3} 
                  borderRadius="lg" 
                  w="100%"
                  border="1px solid"
                  borderColor="red.200"
                >
                  {error}
                </Box>
              )}

              <Button
                type="submit"
                size="lg"
                width="full"
                loading={isLoading}
                backgroundImage="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                color="white"
                fontWeight="bold"
                _hover={{ 
                  backgroundImage: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: 'xl'
                }}
                _active={{
                  transform: 'translateY(0)',
                  boxShadow: 'md'
                }}
                transition="all 0.2s"
                py={6}
              >
                Sign In
              </Button>
            </VStack>
          </form>

          <Box 
            textAlign="center" 
            fontSize="sm" 
            p={4}
            bg="orange.50"
            borderRadius="lg"
            border="1px solid"
            borderColor="orange.200"
          >
            <Text fontWeight="bold" color="orange.800" mb={1}>📝 Demo Credentials</Text>
            <Text color="orange.700">Admin: admin@gmail.com / 12345</Text>
            <Text color="orange.700">Teacher: teacher@gmail.com / 12345</Text>
          </Box>
        </VStack>
      </Box>
    </Container>
    </Box>
  );
};

export default Login;