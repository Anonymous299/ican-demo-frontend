import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  HStack,
  VStack,
  Text,
  Badge,
  Heading,
  SimpleGrid,
  createToaster,
  Flex,
  Spacer,
  Progress,
} from '@chakra-ui/react';
import { 
  FaUser, 
  FaCalendarAlt, 
  FaClock, 
  FaGraduationCap,
  FaTrophy,
  FaChartLine,
  FaClipboardList,
  FaComments,
  FaStar,
  FaBook
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/constants';

interface Student {
  id: number;
  name: string;
  class: string;
  rollNumber: string;
  dateOfBirth: string;
  age: number;
  parentContact: string;
  notes?: string;
}

interface Test {
  id: number;
  title: string;
  description: string;
  subject: string;
  classId: number;
  className: string;
  testType: 'quiz' | 'unit_test' | 'midterm' | 'final' | 'assignment';
  maxMarks: number;
  duration: number;
  scheduledDate: string;
  status: 'draft' | 'published' | 'completed' | 'graded';
  createdByName: string;
}

interface TestResult {
  id: number;
  testId: number;
  studentId: number;
  studentName: string;
  answers: string[];
  score: number;
  maxMarks: number;
  percentage: string;
  timeSpent: number;
  submittedAt: string;
  status: 'submitted' | 'graded';
  feedback?: string;
  gradedBy?: number;
  gradedAt?: string;
}

interface AttendanceRecord {
  studentId: number;
  date: string;
  status: 'present' | 'absent';
  month: string;
}

type ChildView = 'overview' | 'tests' | 'attendance' | 'activities';

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);
  const [currentView, setCurrentView] = useState<ChildView>('overview');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const toaster = createToaster({
    placement: 'top-right',
  });

  useEffect(() => {
    if (user?.role === 'parent' && user.studentIds) {
      fetchChildren();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      fetchChildData();
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!user?.studentIds) return;

      const childrenData: Student[] = [];
      for (const studentId of user.studentIds) {
        const response = await axios.get(`${API_BASE_URL}/api/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        childrenData.push(response.data);
      }
      
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to fetch children information',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async () => {
    if (!selectedChild) return;
    
    try {
      await Promise.all([
        fetchTestResults(),
        fetchTests(),
        fetchAttendance()
      ]);
    } catch (error) {
      console.error('Error fetching child data:', error);
    }
  };

  const fetchTestResults = async () => {
    if (!selectedChild) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/tests`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allResults: TestResult[] = [];
      for (const test of response.data) {
        try {
          const resultsResponse = await axios.get(`${API_BASE_URL}/api/tests/${test.id}/results`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          allResults.push(...resultsResponse.data);
        } catch (error) {
          // Ignore errors for individual tests
        }
      }

      setTestResults(allResults.filter(result => result.studentId === selectedChild.id));
    } catch (error) {
      console.error('Error fetching test results:', error);
    }
  };

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/tests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTests(response.data.filter((test: Test) => test.status === 'published'));
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedChild) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAttendance(response.data.filter((record: AttendanceRecord) => 
        record.studentId === selectedChild.id
      ));
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const calculateStats = () => {
    if (!selectedChild || testResults.length === 0) {
      return { averageScore: 0, totalTests: 0, completedTests: 0, attendanceRate: 0 };
    }

    const completedResults = testResults.filter(r => r.status === 'graded');
    const totalScore = completedResults.reduce((sum, r) => sum + parseFloat(r.percentage), 0);
    const averageScore = completedResults.length > 0 ? totalScore / completedResults.length : 0;

    // Calculate attendance rate for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthAttendance = attendance.filter(a => a.date.startsWith(currentMonth));
    const presentDays = monthAttendance.filter(a => a.status === 'present').length;
    const attendanceRate = monthAttendance.length > 0 ? (presentDays / monthAttendance.length) * 100 : 0;

    return {
      averageScore: Math.round(averageScore),
      totalTests: tests.length,
      completedTests: completedResults.length,
      attendanceRate: Math.round(attendanceRate)
    };
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'green';
    if (percentage >= 80) return 'blue';
    if (percentage >= 70) return 'orange';
    if (percentage >= 60) return 'yellow';
    return 'red';
  };

  const renderOverview = () => {
    const stats = calculateStats();

    return (
      <VStack gap={6} align="stretch">
        {/* Stats Overview */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <Card.Root p={4} textAlign="center">
            <VStack gap={2}>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">{stats.averageScore}%</Text>
              <Text fontSize="sm" color="gray.600">Average Score</Text>
            </VStack>
          </Card.Root>
          
          <Card.Root p={4} textAlign="center">
            <VStack gap={2}>
              <Text fontSize="2xl" fontWeight="bold" color="green.600">{stats.completedTests}</Text>
              <Text fontSize="sm" color="gray.600">Tests Completed</Text>
            </VStack>
          </Card.Root>
          
          <Card.Root p={4} textAlign="center">
            <VStack gap={2}>
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">{stats.attendanceRate}%</Text>
              <Text fontSize="sm" color="gray.600">Attendance</Text>
            </VStack>
          </Card.Root>
          
          <Card.Root p={4} textAlign="center">
            <VStack gap={2}>
              <Text fontSize="2xl" fontWeight="bold" color="orange.600">{stats.totalTests}</Text>
              <Text fontSize="sm" color="gray.600">Total Tests</Text>
            </VStack>
          </Card.Root>
        </SimpleGrid>

        {/* Recent Test Results */}
        <Card.Root>
          <Card.Header>
            <Heading size="md" color="blue.600">
              <FaTrophy style={{ display: 'inline', marginRight: '8px' }} />
              Recent Test Results
            </Heading>
          </Card.Header>
          <Card.Body>
            {testResults.slice(0, 3).length > 0 ? (
              <VStack gap={4} align="stretch">
                {testResults.slice(0, 3).map((result) => {
                  const test = tests.find(t => t.id === result.testId);
                  return (
                    <Box key={result.id} p={4} bg="gray.50" borderRadius="md">
                      <Flex justify="space-between" align="center">
                        <VStack align="start" gap={1}>
                          <Text fontWeight="bold">{test?.title || 'Unknown Test'}</Text>
                          <HStack>
                            <Badge colorScheme="purple">{test?.subject}</Badge>
                            <Badge colorScheme={getGradeColor(parseFloat(result.percentage))}>
                              {result.percentage}%
                            </Badge>
                          </HStack>
                        </VStack>
                        <VStack align="end" gap={1}>
                          <Text fontSize="lg" fontWeight="bold" color="blue.600">
                            {result.score}/{result.maxMarks}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {new Date(result.submittedAt).toLocaleDateString()}
                          </Text>
                        </VStack>
                      </Flex>
                    </Box>
                  );
                })}
              </VStack>
            ) : (
              <Text color="gray.600" textAlign="center" py={4}>
                No test results available yet.
              </Text>
            )}
          </Card.Body>
        </Card.Root>

        {/* Attendance Summary */}
        <Card.Root>
          <Card.Header>
            <Heading size="md" color="green.600">
              <FaCalendarAlt style={{ display: 'inline', marginRight: '8px' }} />
              Attendance This Month
            </Heading>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align="stretch">
              <Flex align="center" gap={4}>
                <Text fontWeight="medium">Overall Attendance:</Text>
                <Progress.Root value={stats.attendanceRate} colorScheme="green" size="lg" flex={1}>
                  <Progress.Track>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
                <Text fontWeight="bold" color="green.600">{stats.attendanceRate}%</Text>
              </Flex>
              
              {attendance.length > 0 ? (
                <SimpleGrid columns={{ base: 5, md: 7 }} gap={2}>
                  {attendance.slice(-14).map((record, index) => (
                    <Box key={index} textAlign="center">
                      <Text fontSize="xs" color="gray.600">
                        {new Date(record.date).getDate()}
                      </Text>
                      <Box
                        w={8}
                        h={8}
                        borderRadius="full"
                        bg={record.status === 'present' ? 'green.100' : 'red.100'}
                        border="2px solid"
                        borderColor={record.status === 'present' ? 'green.500' : 'red.500'}
                        mx="auto"
                        mt={1}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              ) : (
                <Text color="gray.600" textAlign="center" py={4}>
                  No attendance records available.
                </Text>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    );
  };

  const renderTestResults = () => (
    <Card.Root>
      <Card.Header>
        <Heading size="md" color="blue.600">All Test Results</Heading>
      </Card.Header>
      <Card.Body>
        {testResults.length > 0 ? (
          <VStack gap={4} align="stretch">
            {testResults.map((result) => {
              const test = tests.find(t => t.id === result.testId);
              return (
                <Box key={result.id} p={4} borderWidth={1} borderColor="gray.200" borderRadius="md">
                  <Flex justify="space-between" align="start" gap={4}>
                    <VStack align="start" gap={2} flex={1}>
                      <Text fontWeight="bold" fontSize="lg">{test?.title || 'Unknown Test'}</Text>
                      <HStack>
                        <Badge colorScheme="purple">{test?.subject}</Badge>
                        <Badge colorScheme="gray" textTransform="capitalize">
                          {test?.testType?.replace('_', ' ')}
                        </Badge>
                        <Badge colorScheme={result.status === 'graded' ? 'green' : 'orange'}>
                          {result.status === 'graded' ? 'Graded' : 'Pending Grade'}
                        </Badge>
                      </HStack>
                      
                      <Progress.Root 
                        value={parseFloat(result.percentage)} 
                        colorScheme={getGradeColor(parseFloat(result.percentage))}
                        size="md"
                        w="100%"
                      >
                        <Progress.Track>
                          <Progress.Range />
                        </Progress.Track>
                      </Progress.Root>
                      
                      <HStack justify="space-between" w="100%" fontSize="sm" color="gray.600">
                        <Text>Submitted: {new Date(result.submittedAt).toLocaleDateString()}</Text>
                        {result.timeSpent && (
                          <Text>Time: {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s</Text>
                        )}
                      </HStack>
                      
                      {result.feedback && (
                        <Box bg="blue.50" p={3} borderRadius="md" w="100%">
                          <Text fontSize="sm" fontWeight="medium" mb={1}>Teacher Feedback:</Text>
                          <Text fontSize="sm" color="gray.700">"{result.feedback}"</Text>
                        </Box>
                      )}
                    </VStack>
                    
                    <VStack align="end" gap={1}>
                      <Text fontSize="2xl" fontWeight="bold" 
                            color={getGradeColor(parseFloat(result.percentage)) + '.600'}>
                        {result.score}/{result.maxMarks}
                      </Text>
                      <Badge colorScheme={getGradeColor(parseFloat(result.percentage))} size="lg">
                        {result.percentage}%
                      </Badge>
                    </VStack>
                  </Flex>
                </Box>
              );
            })}
          </VStack>
        ) : (
          <Text color="gray.600" textAlign="center" py={8}>
            No test results available yet.
          </Text>
        )}
      </Card.Body>
    </Card.Root>
  );

  const renderView = () => {
    switch (currentView) {
      case 'tests':
        return renderTestResults();
      case 'attendance':
        return (
          <Card.Root>
            <Card.Header>
              <Heading size="md" color="green.600">Attendance Details</Heading>
            </Card.Header>
            <Card.Body>
              <Text color="gray.600" textAlign="center" py={8}>
                Detailed attendance view coming soon.
              </Text>
            </Card.Body>
          </Card.Root>
        );
      case 'activities':
        return (
          <Card.Root>
            <Card.Header>
              <Heading size="md" color="purple.600">Activities & Assignments</Heading>
            </Card.Header>
            <Card.Body>
              <Text color="gray.600" textAlign="center" py={8}>
                Activities view coming soon.
              </Text>
            </Card.Body>
          </Card.Root>
        );
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={8}>
        <Text>Loading parent dashboard...</Text>
      </Box>
    );
  }

  if (!user || user.role !== 'parent') {
    return (
      <Box textAlign="center" py={8}>
        <Text color="red.600">Access denied. Parent role required.</Text>
      </Box>
    );
  }

  if (children.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.600">No children found in your account.</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading mb={6} color="purple.600">
        Parent Portal
      </Heading>

      {/* Child Selection */}
      {children.length > 1 && (
        <Card.Root mb={6}>
          <Card.Header>
            <Text fontWeight="medium">Select Child:</Text>
          </Card.Header>
          <Card.Body>
            <HStack gap={4}>
              {children.map((child) => (
                <Button
                  key={child.id}
                  variant="outline"
                  colorScheme="blue"
                  bg={selectedChild?.id === child.id ? 'blue.500' : 'transparent'}
                  color={selectedChild?.id === child.id ? 'white' : 'blue.500'}
                  onClick={() => setSelectedChild(child)}
                >
                  <FaUser style={{ marginRight: '8px' }} />
                  {child.name}
                </Button>
              ))}
            </HStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* Selected Child Info */}
      {selectedChild && (
        <Card.Root mb={6} p={6} bg="purple.600" color="white">
          <Flex align="center" justify="space-between">
            <HStack gap={4}>
              <Box
                w={16}
                h={16}
                borderRadius="full"
                bg="white"
                color="purple.600"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xl"
                fontWeight="bold"
              >
                {selectedChild.name.charAt(0)}
              </Box>
              <VStack align="start" gap={1}>
                <Heading size="lg">{selectedChild.name}</Heading>
                <Text opacity={0.9}>Class: {selectedChild.class} • Roll No: {selectedChild.rollNumber}</Text>
              </VStack>
            </HStack>
            <FaGraduationCap size={48} opacity={0.7} />
          </Flex>
        </Card.Root>
      )}

      {/* Navigation Tabs */}
      <HStack mb={6} gap={2}>
        <Button
          variant="outline"
          colorScheme="blue"
          bg={currentView === 'overview' ? 'blue.500' : 'transparent'}
          color={currentView === 'overview' ? 'white' : 'blue.500'}
          onClick={() => setCurrentView('overview')}
        >
          <FaChartLine style={{ marginRight: '8px' }} />
          Overview
        </Button>
        <Button
          variant="outline"
          colorScheme="blue"
          bg={currentView === 'tests' ? 'blue.500' : 'transparent'}
          color={currentView === 'tests' ? 'white' : 'blue.500'}
          onClick={() => setCurrentView('tests')}
        >
          <FaClipboardList style={{ marginRight: '8px' }} />
          Test Results
        </Button>
        <Button
          variant="outline"
          colorScheme="blue"
          bg={currentView === 'attendance' ? 'blue.500' : 'transparent'}
          color={currentView === 'attendance' ? 'white' : 'blue.500'}
          onClick={() => setCurrentView('attendance')}
        >
          <FaCalendarAlt style={{ marginRight: '8px' }} />
          Attendance
        </Button>
        <Button
          variant="outline"
          colorScheme="blue"
          bg={currentView === 'activities' ? 'blue.500' : 'transparent'}
          color={currentView === 'activities' ? 'white' : 'blue.500'}
          onClick={() => setCurrentView('activities')}
        >
          <FaBook style={{ marginRight: '8px' }} />
          Activities
        </Button>
      </HStack>

      {/* Main Content */}
      {renderView()}
    </Box>
  );
};

export default ParentDashboard;