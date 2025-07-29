import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  Badge,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { FaUsers, FaClipboardList, FaChartLine, FaComments, FaFileAlt, FaEye } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import StudentInteractionForms from './StudentInteractionForms';
import ActivityCreationForm from './ActivityCreationForm';
import ClassActivityFeed from './ClassActivityFeed';
import StudentTimeline from './StudentTimeline';

interface Class {
  id: number;
  name: string;
  description: string;
  teacherId: number;
  capacity: number;
  currentEnrollment: number;
}

interface Student {
  id: number;
  name: string;
  age: number;
  classId: number;
  dateOfBirth: string;
  parentContact: string;
  notes: string;
}

const TeacherDashboard: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeForm, setActiveForm] = useState<'general' | 'parent' | 'student' | 'peer' | 'observation' | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
    } else {
      setStudents([]);
      setSelectedStudentId(null);
      setSelectedStudent(null);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentDetails(selectedStudentId);
    } else {
      setSelectedStudent(null);
    }
  }, [selectedStudentId]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/classes`);
      setClasses(response.data);
      // Auto-select first class if available
      if (response.data.length > 0) {
        setSelectedClassId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students?classId=${classId}`);
      setStudents(response.data);
      // Auto-select first student if available
      if (response.data.length > 0) {
        setSelectedStudentId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchStudentDetails = async (studentId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students/${studentId}`);
      setSelectedStudent(response.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <Box>
      <Heading mb={6} color="blue.600">
        Teacher Dashboard
      </Heading>

      {/* Class & Student Selection */}
      <Card.Root mb={6}>
        <Card.Header>
          <Heading size="md" color="blue.600">Class & Student Selection</Heading>
        </Card.Header>
        <Card.Body>
          <VStack gap={4} align="stretch">
            {/* Class Selection */}
            <Box>
              <Text mb={3} fontWeight="medium">Select Class:</Text>
              <HStack gap={3} flexWrap="wrap">
                {classes.map((classItem) => (
                  <Button
                    key={classItem.id}
                    size="sm"
                    variant={selectedClassId === classItem.id ? 'solid' : 'outline'}
                    colorScheme="blue"
                    onClick={() => setSelectedClassId(classItem.id)}
                  >
                    {classItem.name}
                  </Button>
                ))}
              </HStack>
              {selectedClass && (
                <Text fontSize="sm" color="gray.600" mt={2}>
                  {selectedClass.description} • {selectedClass.currentEnrollment}/{selectedClass.capacity} students
                </Text>
              )}
            </Box>

            {/* Student Selection */}
            {selectedClassId && (
              <Box>
                <Text mb={3} fontWeight="medium">Select Student:</Text>
                <HStack gap={3} flexWrap="wrap">
                  {students.map((student) => (
                    <Button
                      key={student.id}
                      size="sm"
                      variant={selectedStudentId === student.id ? 'solid' : 'outline'}
                      colorScheme="green"
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      {student.name}
                    </Button>
                  ))}
                </HStack>
              </Box>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Student Info Panel */}
      {selectedStudent && (
        <Card.Root mb={6}>
          <Card.Header>
            <Flex align="center">
              <Heading size="md" color="green.600">Student Information</Heading>
              <Spacer />
              <Badge colorScheme="green">Age {selectedStudent.age}</Badge>
            </Flex>
          </Card.Header>
          <Card.Body>
            <VStack align="start" gap={3}>
              <HStack>
                <Text fontWeight="medium">Name:</Text>
                <Text>{selectedStudent.name}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="medium">Date of Birth:</Text>
                <Text>{new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="medium">Parent Contact:</Text>
                <Text>{selectedStudent.parentContact}</Text>
              </HStack>
              <Box>
                <Text fontWeight="medium" mb={2}>Notes:</Text>
                <Text fontSize="sm" color="gray.600" bg="gray.50" p={3} borderRadius="md">
                  {selectedStudent.notes}
                </Text>
              </Box>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* Student Interaction Tools */}
      {selectedStudent && (
        <Card.Root mb={6}>
          <Card.Header>
            <Heading size="md" color="purple.600">Student Interaction Tools</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 2, md: 5 }} gap={4}>
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={() => setActiveForm('general')}
              >
                <FaFileAlt />
                General Info
              </Button>
              <Button
                size="sm"
                colorScheme="green"
                variant="outline"
                onClick={() => setActiveForm('parent')}
              >
                <FaComments />
                Parent Feedback
              </Button>
              <Button
                size="sm"
                colorScheme="orange"
                variant="outline"
                onClick={() => setActiveForm('student')}
              >
                <FaComments />
                Student Feedback
              </Button>
              <Button
                size="sm"
                colorScheme="purple"
                variant="outline"
                onClick={() => setActiveForm('peer')}
              >
                <FaComments />
                Peer Feedback
              </Button>
              <Button
                size="sm"
                colorScheme="teal"
                variant="outline"
                onClick={() => setActiveForm('observation')}
              >
                <FaEye />
                Teacher Observation
              </Button>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>
      )}

      {/* Student Interaction Form - Overlay Popup */}
      {selectedStudent && activeForm && (
        <Box
          position="fixed"
          top="0"
          left="0"
          w="100vw"
          h="100vh"
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex="modal"
          onClick={() => setActiveForm(null)}
        >
          <Box 
            maxW="lg" 
            w="90%" 
            maxH="90vh" 
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <StudentInteractionForms
              student={selectedStudent}
              formType={activeForm}
              onClose={() => setActiveForm(null)}
            />
          </Box>
        </Box>
      )}

      {/* Activity Creation Form */}
      {selectedStudent && showActivityForm && (
        <Box mb={6}>
          <ActivityCreationForm
            student={selectedStudent}
            onClose={() => setShowActivityForm(false)}
            onSuccess={() => {
              alert('Activity created successfully!');
              setShowActivityForm(false);
            }}
          />
        </Box>
      )}

      {/* Class Activity Feed */}
      {selectedClass && showActivityFeed && (
        <Box mb={6}>
          <ClassActivityFeed
            selectedClass={selectedClass}
            onClose={() => setShowActivityFeed(false)}
          />
        </Box>
      )}

      {/* Student Timeline */}
      {selectedStudent && showTimeline && (
        <Box mb={6}>
          <StudentTimeline
            student={selectedStudent}
            onClose={() => setShowTimeline(false)}
          />
        </Box>
      )}

      {/* Main Feature Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        <Box bg="white" p={6} borderRadius="md" boxShadow="sm" textAlign="center">
          <Box mb={4} display="flex" justifyContent="center">
            <FaClipboardList size={48} color="#38a169" />
          </Box>
          <Heading size="md" mb={2}>Activity Creation</Heading>
          <Text color="gray.600" mb={4}>
            Create activities with domains and competencies
          </Text>
          <Button 
            colorScheme="green" 
            size="sm" 
            disabled={!selectedStudent}
            onClick={() => setShowActivityForm(true)}
          >
            Create Activity
          </Button>
        </Box>

        <Box bg="white" p={6} borderRadius="md" boxShadow="sm" textAlign="center">
          <Box mb={4} display="flex" justifyContent="center">
            <FaUsers size={48} color="#3182ce" />
          </Box>
          <Heading size="md" mb={2}>Class Activity Feed</Heading>
          <Text color="gray.600" mb={4}>
            View activities by other teachers in this class
          </Text>
          <Button 
            colorScheme="blue" 
            size="sm" 
            disabled={!selectedClass}
            onClick={() => setShowActivityFeed(true)}
          >
            View Feed
          </Button>
        </Box>

        <Box bg="white" p={6} borderRadius="md" boxShadow="sm" textAlign="center">
          <Box mb={4} display="flex" justifyContent="center">
            <FaChartLine size={48} color="#805ad5" />
          </Box>
          <Heading size="md" mb={2}>Student Timeline</Heading>
          <Text color="gray.600" mb={4}>
            View student progress and activity history
          </Text>
          <Button 
            colorScheme="purple" 
            size="sm" 
            disabled={!selectedStudent}
            onClick={() => setShowTimeline(true)}
          >
            View Timeline
          </Button>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default TeacherDashboard;