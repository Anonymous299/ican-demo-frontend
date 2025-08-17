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
import { FaUsers, FaClipboardList, FaChartLine, FaComments, FaFileAlt, FaEye, FaImage, FaCheck, FaFilePdf, FaUpload, FaTimes, FaCalendarCheck, FaQuestionCircle, FaBook } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import StudentInteractionForms from './StudentInteractionForms';
import ActivityCreationForm from './ActivityCreationForm';
import ClassActivityFeed from './ClassActivityFeed';
import StudentTimeline from './StudentTimeline';
import StudentPortfolio from './StudentPortfolio';
import QuickAttendance from './QuickAttendance';
import TestManagement from './TestManagement';
import LessonPlanManagement from './LessonPlanManagement';

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
  const [activeForm, setActiveForm] = useState<'general' | 'parent' | 'student' | 'peer' | 'observation' | 'assessment' | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [showLessonPlans, setShowLessonPlans] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<'term1' | 'term2'>('term1');
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [demoPdfStatus, setDemoPdfStatus] = useState({ available: false, size: 0 });

  useEffect(() => {
    fetchClasses();
    checkDemoPdfStatus();
  }, []);

  const checkDemoPdfStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/demo-pdf-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDemoPdfStatus(response.data);
    } catch (error) {
      console.error('Error checking demo PDF status:', error);
    }
  };

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

  const handleGenerateHPC = async () => {
    if (!selectedStudent) {
      alert('Please select a student first');
      return;
    }

    if (!demoPdfStatus.available) {
      alert('Demo PDF not uploaded yet. Please upload a demo PDF first using the "Upload Demo PDF" button.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/generate-hpc/${selectedStudent.id}/${selectedTerm}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create blob link to download the PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HPC_${selectedStudent.name}_${selectedTerm.toUpperCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating HPC:', error);
      alert('Error generating HPC. Please try again.');
    }
  };

  const handleUploadDemoPdf = async (file: File) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('demoPdf', file);

      const response = await axios.post(`${API_BASE_URL}/api/upload-demo-pdf`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Demo PDF uploaded successfully!');
      checkDemoPdfStatus();
      setShowPdfUpload(false);
    } catch (error) {
      console.error('Error uploading demo PDF:', error);
      alert('Error uploading demo PDF. Please try again.');
    }
  };

  return (
    <Box>
      {/* Quick Attendance - Full Page */}
      {showAttendance && (
        <QuickAttendance onBack={() => setShowAttendance(false)} />
      )}

      {/* Test Management - Full Page */}
      {showTests && (
        <Box>
          <HStack mb={4}>
            <Button
              variant="outline"
              onClick={() => setShowTests(false)}
            >
              <FaTimes />
              Back to Dashboard
            </Button>
          </HStack>
          <TestManagement />
        </Box>
      )}

      {/* Lesson Plan Management - Full Page */}
      {showLessonPlans && (
        <Box>
          <HStack mb={4}>
            <Button
              variant="outline"
              onClick={() => setShowLessonPlans(false)}
            >
              <FaTimes />
              Back to Dashboard
            </Button>
          </HStack>
          <LessonPlanManagement />
        </Box>
      )}

      {/* Main Dashboard Content */}
      {!showAttendance && !showTests && !showLessonPlans && (
        <>
          <Heading mb={6} color="blue.600">
            Teacher Dashboard
          </Heading>

      {/* Demo PDF Upload Section */}
      <Card.Root mb={6}>
        <Card.Header>
          <Flex align="center">
            <Heading size="md" color="purple.600">Demo PDF Management</Heading>
            <Spacer />
            <Badge colorScheme={demoPdfStatus.available ? 'green' : 'red'}>
              {demoPdfStatus.available ? 'PDF Available' : 'No PDF Uploaded'}
            </Badge>
          </Flex>
        </Card.Header>
        <Card.Body>
          <VStack gap={4} align="stretch">
            <Text fontSize="sm" color="gray.600">
              Upload a demo HPC PDF that will be downloaded when teachers generate HPCs for students.
              {demoPdfStatus.available && ` Current file size: ${(demoPdfStatus.size / 1024).toFixed(1)} KB`}
            </Text>
            <HStack>
              <Button
                size="sm"
                colorScheme="purple"
                variant="outline"
                onClick={() => setShowPdfUpload(true)}
              >
                <FaUpload />
                Upload Demo PDF
              </Button>
              {demoPdfStatus.available && (
                <Text fontSize="xs" color="green.600">
                  ✓ Demo PDF is ready for HPC generation
                </Text>
              )}
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>

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
            <Flex align="center">
              <VStack align="start" gap={1}>
                <Heading size="md" color="purple.600">Student Interaction Tools</Heading>
                <Text fontSize="sm" color="gray.600">
                  Recording interactions for {selectedStudent.name}
                </Text>
              </VStack>
              <Spacer />
              <HStack gap={2}>
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  Academic Term:
                </Text>
                <Button
                  size="xs"
                  variant={selectedTerm === 'term1' ? 'solid' : 'outline'}
                  colorScheme="purple"
                  onClick={() => setSelectedTerm('term1')}
                >
                  Term 1
                </Button>
                <Button
                  size="xs"
                  variant={selectedTerm === 'term2' ? 'solid' : 'outline'}
                  colorScheme="purple"
                  onClick={() => setSelectedTerm('term2')}
                >
                  Term 2
                </Button>
              </HStack>
            </Flex>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 2, md: 7 }} gap={4}>
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
                Teacher Anecdote
              </Button>
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={() => setActiveForm('assessment')}
              >
                <FaCheck />
                Assessment Rubric
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={() => handleGenerateHPC()}
              >
                <FaFilePdf />
                Generate HPC
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
            maxW={activeForm === 'assessment' ? '6xl' : 'lg'} 
            w={activeForm === 'assessment' ? '95%' : '90%'} 
            maxH="90vh" 
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <StudentInteractionForms
              student={selectedStudent}
              formType={activeForm}
              selectedTerm={selectedTerm}
              onClose={() => setActiveForm(null)}
            />
          </Box>
        </Box>
      )}

      {/* Activity Creation Form */}
      {selectedClass && showActivityForm && (
        <Box mb={6}>
          <ActivityCreationForm
            selectedClass={selectedClass}
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

      {/* Student Portfolio */}
      {selectedStudent && showPortfolio && (
        <Box mb={6}>
          <StudentPortfolio
            student={selectedStudent}
            onClose={() => setShowPortfolio(false)}
          />
        </Box>
      )}

      {/* Demo PDF Upload Modal */}
      {showPdfUpload && (
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
          onClick={() => setShowPdfUpload(false)}
        >
          <Box 
            maxW="md" 
            w="90%" 
            onClick={(e) => e.stopPropagation()}
          >
            <Card.Root>
              <Card.Header>
                <Flex align="center">
                  <Heading size="md" color="purple.600">
                    Upload Demo PDF
                  </Heading>
                  <Spacer />
                  <Button size="sm" variant="ghost" onClick={() => setShowPdfUpload(false)}>
                    <FaTimes />
                  </Button>
                </Flex>
              </Card.Header>
              <Card.Body>
                <VStack gap={4} align="stretch">
                  <Text fontSize="sm" color="gray.600">
                    Choose a PDF file to use as the demo HPC that will be downloaded when teachers generate HPCs.
                  </Text>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          alert('Please select a PDF file');
                          return;
                        }
                        handleUploadDemoPdf(file);
                      }
                    }}
                    style={{
                      padding: '8px',
                      border: '2px dashed #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  />
                  <Text fontSize="xs" color="gray.500">
                    Only PDF files are allowed. Maximum recommended size: 10MB
                  </Text>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Box>
        </Box>
      )}

      {/* Main Feature Cards */}
      <SimpleGrid columns={{ base: 1, md: 3, lg: 6 }} gap={6}>
        <Box bg="white" p={6} borderRadius="md" boxShadow="sm" textAlign="center">
          <Box mb={4} display="flex" justifyContent="center">
            <FaClipboardList size={48} color="#38a169" />
          </Box>
          <Heading size="md" mb={2}>Activity Creation</Heading>
          <Text color="gray.600" mb={4}>
            Create class-wide activities with domains and competencies
          </Text>
          <Button 
            colorScheme="green" 
            size="sm" 
            disabled={!selectedClass}
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

        <Box bg="white" p={6} borderRadius="md" boxShadow="sm" textAlign="center">
          <Box mb={4} display="flex" justifyContent="center">
            <FaImage size={48} color="#d53f8c" />
          </Box>
          <Heading size="md" mb={2}>Student Portfolio</Heading>
          <Text color="gray.600" mb={4}>
            Upload and manage student artwork and projects
          </Text>
          <Button 
            colorScheme="pink" 
            size="sm" 
            disabled={!selectedStudent}
            onClick={() => setShowPortfolio(true)}
          >
            Manage Portfolio
          </Button>
        </Box>

        <Box bg="white" p={6} borderRadius="md" boxShadow="sm" textAlign="center">
          <Box mb={4} display="flex" justifyContent="center">
            <FaCalendarCheck size={48} color="#4299e1" />
          </Box>
          <Heading size="md" mb={2}>Attendance</Heading>
          <Text color="gray.600" mb={4}>
            Mark and track student attendance records
          </Text>
          <Button 
            colorScheme="blue" 
            size="sm" 
            onClick={() => setShowAttendance(true)}
          >
            Manage Attendance
          </Button>
        </Box>

        <Box bg="white" p={6} borderRadius="md" boxShadow="sm" textAlign="center">
          <Box mb={4} display="flex" justifyContent="center">
            <FaQuestionCircle size={48} color="#ed8936" />
          </Box>
          <Heading size="md" mb={2}>Test Management</Heading>
          <Text color="gray.600" mb={4}>
            Create and manage quizzes, tests, and assessments
          </Text>
          <Button 
            colorScheme="orange" 
            size="sm" 
            onClick={() => setShowTests(true)}
          >
            Manage Tests
          </Button>
        </Box>

        <Box bg="white" p={6} borderRadius="md" boxShadow="sm" textAlign="center">
          <Box mb={4} display="flex" justifyContent="center">
            <FaBook size={48} color="#9f7aea" />
          </Box>
          <Heading size="md" mb={2}>Lesson Plans</Heading>
          <Text color="gray.600" mb={4}>
            View and customize your assigned lesson plans
          </Text>
          <Button 
            colorScheme="purple" 
            size="sm" 
            onClick={() => setShowLessonPlans(true)}
          >
            Manage Lesson Plans
          </Button>
        </Box>
      </SimpleGrid>
        </>
      )}
    </Box>
  );
};

export default TeacherDashboard;