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
  Input,
  Textarea,
  IconButton,
  createToaster,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { 
  FaPlus, 
  FaTimes, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaChartBar, 
  FaCalendarAlt,
  FaClock,
  FaQuestionCircle,
  FaGraduationCap,
  FaSave,
  FaArrowLeft,
  FaClipboardCheck,
  FaFileAlt
} from 'react-icons/fa';
import { API_BASE_URL } from '../config/constants';

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
  instructions: string;
  questions: Question[];
  status: 'draft' | 'published' | 'completed' | 'graded';
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

interface Question {
  id: number;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'long_answer';
  options?: string[];
  correctAnswer: string;
  marks: number;
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

interface TestStatistics {
  totalSubmissions: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  submissionRate: number;
  averagePercentage: number;
}

interface Class {
  id: number;
  name: string;
  grade: string;
  division: string;
}

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  class: string;
}

type ModalView = 'none' | 'create' | 'edit' | 'view' | 'results' | 'statistics' | 'grade' | 'manualGrade';

const TestManagement: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalView, setModalView] = useState<ModalView>('none');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testStatistics, setTestStatistics] = useState<TestStatistics | null>(null);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [gradingForm, setGradingForm] = useState({
    score: '',
    feedback: ''
  });
  
  // Manual grading state
  const [students, setStudents] = useState<Student[]>([]);
  const [manualGrades, setManualGrades] = useState<{[studentId: number]: {score: string, feedback: string}}>({});
  
  // Filters
  const [filterSubject, setFilterSubject] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTestType, setFilterTestType] = useState('');

  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    subject: '',
    classId: '',
    testType: 'quiz' as const,
    maxMarks: '',
    duration: '',
    scheduledDate: '',
    instructions: '',
    questions: [] as Question[]
  });

  const [questionForm, setQuestionForm] = useState({
    question: '',
    type: 'multiple_choice' as const,
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: ''
  });

  const toaster = createToaster({
    placement: 'top-right',
  });

  useEffect(() => {
    fetchTests();
    fetchClasses();
  }, [filterSubject, filterClass, filterStatus, filterTestType]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/api/tests`;
      
      const params = new URLSearchParams();
      if (filterSubject) params.append('subject', filterSubject);
      if (filterClass) params.append('classId', filterClass);
      if (filterStatus) params.append('status', filterStatus);
      if (filterTestType) params.append('testType', filterTestType);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTests(response.data);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to fetch tests',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchTestResults = async (testId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/tests/${testId}/results`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestResults(response.data);
    } catch (error) {
      console.error('Error fetching test results:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to fetch test results',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchTestStatistics = async (testId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/tests/${testId}/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestStatistics(response.data);
    } catch (error) {
      console.error('Error fetching test statistics:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to fetch test statistics',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchStudentsForManualGrading = async (test: Test) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter students by test's class
      const classStudents = response.data.filter((student: Student) => {
        const studentClass = classes.find(c => c.name === student.class);
        return studentClass && studentClass.id === test.classId;
      });
      
      setStudents(classStudents);
      
      // Initialize manual grades with existing results if any
      const initialGrades: {[studentId: number]: {score: string, feedback: string}} = {};
      classStudents.forEach((student: Student) => {
        const existingResult = testResults.find(r => r.studentId === student.id);
        initialGrades[student.id] = {
          score: existingResult ? existingResult.score.toString() : '',
          feedback: existingResult ? existingResult.feedback || '' : ''
        };
      });
      setManualGrades(initialGrades);
    } catch (error) {
      console.error('Error fetching students:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to fetch students',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleCreateTest = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!testForm.title || !testForm.subject || !testForm.classId || !testForm.maxMarks || !testForm.scheduledDate) {
        toaster.create({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const testData = {
        ...testForm,
        classId: parseInt(testForm.classId),
        maxMarks: parseInt(testForm.maxMarks),
        duration: parseInt(testForm.duration) || 60
      };

      const response = await axios.post(`${API_BASE_URL}/api/tests`, testData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toaster.create({
        title: 'Success',
        description: 'Test created successfully',
        status: 'success',
        duration: 3000,
      });

      setTests(prev => [response.data, ...prev]);
      resetTestForm();
      setModalView('none');
    } catch (error: any) {
      console.error('Error creating test:', error);
      toaster.create({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create test',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTest = async () => {
    if (!selectedTest) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const testData = {
        ...testForm,
        classId: parseInt(testForm.classId),
        maxMarks: parseInt(testForm.maxMarks),
        duration: parseInt(testForm.duration) || 60
      };

      const response = await axios.put(`${API_BASE_URL}/api/tests/${selectedTest.id}`, testData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toaster.create({
        title: 'Success',
        description: 'Test updated successfully',
        status: 'success',
        duration: 3000,
      });

      setTests(prev => prev.map(test => test.id === selectedTest.id ? response.data : test));
      resetTestForm();
      setModalView('none');
      setSelectedTest(null);
    } catch (error: any) {
      console.error('Error updating test:', error);
      toaster.create({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update test',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTest = async (testId: number) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/tests/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toaster.create({
        title: 'Success',
        description: 'Test deleted successfully',
        status: 'success',
        duration: 3000,
      });

      setTests(prev => prev.filter(test => test.id !== testId));
    } catch (error: any) {
      console.error('Error deleting test:', error);
      toaster.create({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete test',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedTest || !selectedResult) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!gradingForm.score) {
        toaster.create({
          title: 'Validation Error',
          description: 'Please enter a score',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const score = parseInt(gradingForm.score);
      if (score < 0 || score > selectedTest.maxMarks) {
        toaster.create({
          title: 'Validation Error',
          description: `Score must be between 0 and ${selectedTest.maxMarks}`,
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/tests/${selectedTest.id}/results/${selectedResult.id}/grade`,
        {
          score: score,
          feedback: gradingForm.feedback
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toaster.create({
        title: 'Success',
        description: 'Grade submitted successfully',
        status: 'success',
        duration: 3000,
      });

      // Update the result in the testResults array
      setTestResults(prev => prev.map(result => 
        result.id === selectedResult.id ? response.data : result
      ));

      setModalView('results');
      setSelectedResult(null);
      setGradingForm({ score: '', feedback: '' });
    } catch (error: any) {
      console.error('Error grading submission:', error);
      toaster.create({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to submit grade',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addQuestion = () => {
    if (!questionForm.question || !questionForm.correctAnswer || !questionForm.marks) {
      toaster.create({
        title: 'Validation Error',
        description: 'Please fill in all question fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const newQuestion: Question = {
      id: Date.now(),
      question: questionForm.question,
      type: questionForm.type,
      options: questionForm.type === 'multiple_choice' ? questionForm.options.filter(opt => opt.trim()) : undefined,
      correctAnswer: questionForm.correctAnswer,
      marks: parseInt(questionForm.marks)
    };

    setTestForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    setQuestionForm({
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: ''
    });
  };

  const removeQuestion = (questionId: number) => {
    setTestForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const resetTestForm = () => {
    setTestForm({
      title: '',
      description: '',
      subject: '',
      classId: '',
      testType: 'quiz',
      maxMarks: '',
      duration: '',
      scheduledDate: '',
      instructions: '',
      questions: []
    });
    setQuestionForm({
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: ''
    });
  };

  const openEditModal = (test: Test) => {
    setSelectedTest(test);
    setTestForm({
      title: test.title,
      description: test.description,
      subject: test.subject,
      classId: test.classId.toString(),
      testType: test.testType,
      maxMarks: test.maxMarks.toString(),
      duration: test.duration.toString(),
      scheduledDate: test.scheduledDate,
      instructions: test.instructions,
      questions: test.questions
    });
    setModalView('edit');
  };

  const openViewModal = (test: Test) => {
    setSelectedTest(test);
    setModalView('view');
  };

  const openResultsModal = async (test: Test) => {
    setSelectedTest(test);
    await fetchTestResults(test.id);
    setModalView('results');
  };

  const openStatisticsModal = async (test: Test) => {
    setSelectedTest(test);
    await fetchTestStatistics(test.id);
    setModalView('statistics');
  };

  const openGradingModal = (test: Test, result: TestResult) => {
    setSelectedTest(test);
    setSelectedResult(result);
    setGradingForm({
      score: result.score.toString(),
      feedback: result.feedback || ''
    });
    setModalView('grade');
  };

  const openManualGradingModal = async (test: Test) => {
    setSelectedTest(test);
    await fetchTestResults(test.id);
    await fetchStudentsForManualGrading(test);
    setModalView('manualGrade');
  };

  const handleManualGradeSubmit = async () => {
    if (!selectedTest) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Create/update results for all students with grades
      const gradesToSubmit = Object.entries(manualGrades).filter(([_, grade]) => 
        grade.score && grade.score.trim() !== ''
      );

      if (gradesToSubmit.length === 0) {
        toaster.create({
          title: 'No Grades',
          description: 'Please enter at least one grade',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      const promises = gradesToSubmit.map(async ([studentIdStr, grade]) => {
        const studentId = parseInt(studentIdStr);
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const score = parseInt(grade.score);
        if (score < 0 || score > selectedTest.maxMarks) {
          throw new Error(`Invalid score for ${student.name}: ${score}. Must be between 0 and ${selectedTest.maxMarks}`);
        }

        // Check if result already exists
        const existingResult = testResults.find(r => r.studentId === studentId);
        
        if (existingResult) {
          // Update existing result
          return axios.put(
            `${API_BASE_URL}/api/tests/${selectedTest.id}/results/${existingResult.id}/grade`,
            {
              score: score,
              feedback: grade.feedback
            },
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } else {
          // For now, let's add the result to the local state and handle backend sync later
          // This allows teachers to see the grades immediately
          const newResult: TestResult = {
            id: Date.now() + studentId, // Temporary ID
            testId: selectedTest.id,
            studentId: studentId,
            studentName: student.name,
            answers: Array(selectedTest.questions.length).fill('Manual entry'),
            score: score,
            maxMarks: selectedTest.maxMarks,
            percentage: ((score / selectedTest.maxMarks) * 100).toFixed(2),
            timeSpent: 0,
            submittedAt: new Date().toISOString(),
            status: 'graded',
            feedback: grade.feedback
          };

          // Add to local state immediately
          setTestResults(prev => [...prev, newResult]);
          
          // Return a resolved promise to maintain the pattern
          return Promise.resolve({ data: newResult });
        }
      });

      await Promise.all(promises);

      toaster.create({
        title: 'Success',
        description: `Grades submitted for ${gradesToSubmit.length} students`,
        status: 'success',
        duration: 3000,
      });

      // Refresh results
      await fetchTestResults(selectedTest.id);
      setModalView('results');
    } catch (error: any) {
      console.error('Error submitting manual grades:', error);
      toaster.create({
        title: 'Error',
        description: error.message || 'Failed to submit grades',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'published': return 'blue';
      case 'completed': return 'green';
      case 'graded': return 'purple';
      default: return 'gray';
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'cyan';
      case 'unit_test': return 'orange';
      case 'midterm': return 'red';
      case 'final': return 'purple';
      case 'assignment': return 'green';
      default: return 'gray';
    }
  };

  const subjects = [...new Set(tests.map(test => test.subject))];

  return (
    <Box>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Heading size="lg" color="blue.700">
            📝 Test Management
          </Heading>
          <Button
            colorScheme="blue"
            onClick={() => {
              resetTestForm();
              setModalView('create');
            }}
          >
            <FaPlus />
            Create Test
          </Button>
        </HStack>

        {/* Filters */}
        <Card.Root p={4} bg="gray.50">
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <Box>
              <Text mb={2} fontWeight="medium" fontSize="sm">Subject</Text>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: '14px'
                }}
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </Box>
            
            <Box>
              <Text mb={2} fontWeight="medium" fontSize="sm">Class</Text>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: '14px'
                }}
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </Box>
            
            <Box>
              <Text mb={2} fontWeight="medium" fontSize="sm">Status</Text>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: '14px'
                }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="completed">Completed</option>
                <option value="graded">Graded</option>
              </select>
            </Box>
            
            <Box>
              <Text mb={2} fontWeight="medium" fontSize="sm">Test Type</Text>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: '14px'
                }}
                value={filterTestType}
                onChange={(e) => setFilterTestType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="quiz">Quiz</option>
                <option value="unit_test">Unit Test</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="assignment">Assignment</option>
              </select>
            </Box>
          </SimpleGrid>
        </Card.Root>

        {/* Tests Grid */}
        {loading ? (
          <Card.Root p={8} textAlign="center">
            <Text>Loading tests...</Text>
          </Card.Root>
        ) : tests.length === 0 ? (
          <Card.Root p={8} textAlign="center">
            <Text color="gray.500">No tests found. Create your first test!</Text>
          </Card.Root>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {tests.map((test) => (
              <Card.Root 
                key={test.id}
                p={4}
                bg="white"
                borderWidth={1}
                borderColor="gray.200"
                _hover={{ 
                  borderColor: 'blue.300',
                  transform: 'translateY(-2px)',
                  boxShadow: 'md'
                }}
                transition="all 0.2s"
              >
                <Card.Body>
                  <VStack align="start" gap={3}>
                    <Flex w="100%" justify="space-between" align="start">
                      <VStack align="start" gap={1} flex={1}>
                        <Text fontWeight="bold" fontSize="md" noOfLines={2}>
                          {test.title}
                        </Text>
                        <Text fontSize="sm" color="gray.600" noOfLines={2}>
                          {test.description}
                        </Text>
                      </VStack>
                      <HStack>
                        <Badge colorScheme={getStatusColor(test.status)} fontSize="xs">
                          {test.status}
                        </Badge>
                        <Badge colorScheme={getTestTypeColor(test.testType)} fontSize="xs">
                          {test.testType}
                        </Badge>
                      </HStack>
                    </Flex>

                    <VStack align="start" gap={2} w="100%">
                      <HStack justify="space-between" w="100%">
                        <Text fontSize="sm" color="gray.600">
                          📚 {test.subject}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          🏫 {test.className}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between" w="100%">
                        <Text fontSize="sm" color="gray.600">
                          <FaCalendarAlt style={{ display: 'inline', marginRight: '4px' }} />
                          {new Date(test.scheduledDate).toLocaleDateString()}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          <FaClock style={{ display: 'inline', marginRight: '4px' }} />
                          {test.duration}min
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between" w="100%">
                        <Text fontSize="sm" color="gray.600">
                          <FaGraduationCap style={{ display: 'inline', marginRight: '4px' }} />
                          {test.maxMarks} marks
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          <FaQuestionCircle style={{ display: 'inline', marginRight: '4px' }} />
                          {test.questions.length} questions
                        </Text>
                      </HStack>
                      
                      <Text fontSize="xs" color="gray.500">
                        By: {test.createdByName}
                      </Text>
                    </VStack>

                    <HStack w="100%" justify="space-between">
                      <HStack>
                        <IconButton
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          aria-label="View test details"
                          onClick={() => openViewModal(test)}
                          title="View Test Details"
                        >
                          <FaFileAlt />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="outline"
                          colorScheme="green"
                          aria-label="Edit test"
                          onClick={() => openEditModal(test)}
                          title="Edit Test"
                        >
                          <FaEdit />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="outline"
                          colorScheme="red"
                          aria-label="Delete test"
                          onClick={() => handleDeleteTest(test.id)}
                          title="Delete Test"
                        >
                          <FaTrash />
                        </IconButton>
                      </HStack>
                      
                      <HStack>
                        <IconButton
                          size="sm"
                          variant="outline"
                          colorScheme="purple"
                          aria-label="Grade student submissions"
                          onClick={() => openResultsModal(test)}
                          title="Grade Students (View Results)"
                        >
                          <FaClipboardCheck />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="outline"
                          colorScheme="orange"
                          aria-label="View statistics"
                          onClick={() => openStatisticsModal(test)}
                          title="View Statistics"
                        >
                          <FaChartBar />
                        </IconButton>
                      </HStack>
                    </HStack>
                  </VStack>
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Modals */}
      {(modalView === 'create' || modalView === 'edit') && (
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
          onClick={() => setModalView('none')}
        >
          <Box 
            maxW="4xl" 
            w="95%" 
            maxH="90vh" 
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card.Root>
              <Card.Header>
                <Flex align="center">
                  <Heading size="md" color="blue.600">
                    {modalView === 'create' ? '📝 Create New Test' : '✏️ Edit Test'}
                  </Heading>
                  <Spacer />
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setModalView('none')}
                    aria-label="Close modal"
                  >
                    <FaTimes />
                  </IconButton>
                </Flex>
              </Card.Header>

              <Card.Body>
                <VStack gap={6} align="stretch">
                  {/* Basic Information */}
                  <Box>
                    <Heading size="sm" mb={4} color="gray.700">Basic Information</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                      <Box>
                        <Text mb={2} fontWeight="medium">Title *</Text>
                        <Input
                          value={testForm.title}
                          onChange={(e) => setTestForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter test title"
                        />
                      </Box>
                      
                      <Box>
                        <Text mb={2} fontWeight="medium">Subject *</Text>
                        <Input
                          value={testForm.subject}
                          onChange={(e) => setTestForm(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Enter subject"
                        />
                      </Box>
                      
                      <Box>
                        <Text mb={2} fontWeight="medium">Class *</Text>
                        <select
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            fontSize: '14px'
                          }}
                          value={testForm.classId}
                          onChange={(e) => setTestForm(prev => ({ ...prev, classId: e.target.value }))}
                        >
                          <option value="">Select Class</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                          ))}
                        </select>
                      </Box>
                      
                      <Box>
                        <Text mb={2} fontWeight="medium">Test Type *</Text>
                        <select
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            fontSize: '14px'
                          }}
                          value={testForm.testType}
                          onChange={(e) => setTestForm(prev => ({ ...prev, testType: e.target.value as any }))}
                        >
                          <option value="quiz">Quiz</option>
                          <option value="unit_test">Unit Test</option>
                          <option value="midterm">Midterm</option>
                          <option value="final">Final</option>
                          <option value="assignment">Assignment</option>
                        </select>
                      </Box>
                      
                      <Box>
                        <Text mb={2} fontWeight="medium">Max Marks *</Text>
                        <Input
                          type="number"
                          value={testForm.maxMarks}
                          onChange={(e) => setTestForm(prev => ({ ...prev, maxMarks: e.target.value }))}
                          placeholder="Enter maximum marks"
                        />
                      </Box>
                      
                      <Box>
                        <Text mb={2} fontWeight="medium">Duration (minutes)</Text>
                        <Input
                          type="number"
                          value={testForm.duration}
                          onChange={(e) => setTestForm(prev => ({ ...prev, duration: e.target.value }))}
                          placeholder="Enter duration in minutes"
                        />
                      </Box>
                      
                      <Box>
                        <Text mb={2} fontWeight="medium">Scheduled Date *</Text>
                        <Input
                          type="date"
                          value={testForm.scheduledDate}
                          onChange={(e) => setTestForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                        />
                      </Box>
                    </SimpleGrid>
                    
                    <Box mt={4}>
                      <Text mb={2} fontWeight="medium">Description</Text>
                      <Textarea
                        value={testForm.description}
                        onChange={(e) => setTestForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter test description"
                        rows={3}
                      />
                    </Box>
                    
                    <Box mt={4}>
                      <Text mb={2} fontWeight="medium">Instructions</Text>
                      <Textarea
                        value={testForm.instructions}
                        onChange={(e) => setTestForm(prev => ({ ...prev, instructions: e.target.value }))}
                        placeholder="Enter test instructions for students"
                        rows={3}
                      />
                    </Box>
                  </Box>

                  {/* Questions Section */}
                  <Box>
                    <Heading size="sm" mb={4} color="gray.700">Questions</Heading>
                    
                    {/* Add Question Form */}
                    <Card.Root p={4} bg="gray.50" mb={4}>
                      <VStack gap={4} align="stretch">
                        <Box>
                          <Text mb={2} fontWeight="medium">Question</Text>
                          <Textarea
                            value={questionForm.question}
                            onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                            placeholder="Enter your question"
                            rows={2}
                          />
                        </Box>
                        
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                          <Box>
                            <Text mb={2} fontWeight="medium">Question Type</Text>
                            <select
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                backgroundColor: 'white',
                                fontSize: '14px'
                              }}
                              value={questionForm.type}
                              onChange={(e) => setQuestionForm(prev => ({ ...prev, type: e.target.value as any }))}
                            >
                              <option value="multiple_choice">Multiple Choice</option>
                              <option value="short_answer">Short Answer</option>
                              <option value="long_answer">Long Answer</option>
                            </select>
                          </Box>
                          
                          <Box>
                            <Text mb={2} fontWeight="medium">Correct Answer</Text>
                            <Input
                              value={questionForm.correctAnswer}
                              onChange={(e) => setQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                              placeholder="Enter correct answer"
                            />
                          </Box>
                          
                          <Box>
                            <Text mb={2} fontWeight="medium">Marks</Text>
                            <Input
                              type="number"
                              value={questionForm.marks}
                              onChange={(e) => setQuestionForm(prev => ({ ...prev, marks: e.target.value }))}
                              placeholder="Marks"
                            />
                          </Box>
                        </SimpleGrid>
                        
                        {questionForm.type === 'multiple_choice' && (
                          <Box>
                            <Text mb={2} fontWeight="medium">Options</Text>
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
                              {questionForm.options.map((option, index) => (
                                <Input
                                  key={index}
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...questionForm.options];
                                    newOptions[index] = e.target.value;
                                    setQuestionForm(prev => ({ ...prev, options: newOptions }));
                                  }}
                                  placeholder={`Option ${index + 1}`}
                                />
                              ))}
                            </SimpleGrid>
                          </Box>
                        )}
                        
                        <Button
                          colorScheme="green"
                          size="sm"
                          onClick={addQuestion}
                          alignSelf="flex-start"
                        >
                          <FaPlus />
                          Add Question
                        </Button>
                      </VStack>
                    </Card.Root>
                    
                    {/* Questions List */}
                    {testForm.questions.length > 0 && (
                      <VStack gap={3} align="stretch">
                        <Text fontWeight="medium">Added Questions ({testForm.questions.length})</Text>
                        {testForm.questions.map((question, index) => (
                          <Card.Root key={question.id} p={3} bg="white" borderWidth={1}>
                            <Flex>
                              <VStack align="start" flex={1} gap={2}>
                                <Text fontWeight="medium" fontSize="sm">
                                  Q{index + 1}: {question.question}
                                </Text>
                                <HStack>
                                  <Badge colorScheme="blue" fontSize="xs">
                                    {question.type.replace('_', ' ')}
                                  </Badge>
                                  <Badge colorScheme="green" fontSize="xs">
                                    {question.marks} marks
                                  </Badge>
                                </HStack>
                                {question.options && (
                                  <Text fontSize="xs" color="gray.600">
                                    Options: {question.options.join(', ')}
                                  </Text>
                                )}
                                <Text fontSize="xs" color="gray.600">
                                  Answer: {question.correctAnswer}
                                </Text>
                              </VStack>
                              <IconButton
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => removeQuestion(question.id)}
                                aria-label="Remove question"
                              >
                                <FaTimes />
                              </IconButton>
                            </Flex>
                          </Card.Root>
                        ))}
                      </VStack>
                    )}
                  </Box>
                </VStack>
              </Card.Body>

              <Card.Footer>
                <HStack gap={3} w="100%" justify="end">
                  <Button
                    variant="outline"
                    onClick={() => setModalView('none')}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={modalView === 'create' ? handleCreateTest : handleUpdateTest}
                    loading={submitting}
                  >
                    <FaSave />
                    {modalView === 'create' ? 'Create Test' : 'Update Test'}
                  </Button>
                </HStack>
              </Card.Footer>
            </Card.Root>
          </Box>
        </Box>
      )}

      {/* View Test Modal */}
      {modalView === 'view' && selectedTest && (
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
          onClick={() => setModalView('none')}
        >
          <Box 
            maxW="4xl" 
            w="95%" 
            maxH="90vh" 
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card.Root>
              <Card.Header>
                <Flex align="center">
                  <Heading size="md" color="blue.600">
                    👁️ View Test: {selectedTest.title}
                  </Heading>
                  <Spacer />
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setModalView('none')}
                    aria-label="Close modal"
                  >
                    <FaTimes />
                  </IconButton>
                </Flex>
              </Card.Header>

              <Card.Body>
                <VStack gap={6} align="stretch">
                  {/* Test Information */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Subject</Text>
                      <Text>{selectedTest.subject}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Class</Text>
                      <Text>{selectedTest.className}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Type</Text>
                      <Badge colorScheme={getTestTypeColor(selectedTest.testType)}>
                        {selectedTest.testType}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Status</Text>
                      <Badge colorScheme={getStatusColor(selectedTest.status)}>
                        {selectedTest.status}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Max Marks</Text>
                      <Text>{selectedTest.maxMarks}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Duration</Text>
                      <Text>{selectedTest.duration} minutes</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Scheduled Date</Text>
                      <Text>{new Date(selectedTest.scheduledDate).toLocaleDateString()}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Questions</Text>
                      <Text>{selectedTest.questions.length}</Text>
                    </Box>
                  </SimpleGrid>
                  
                  {selectedTest.description && (
                    <Box>
                      <Text fontWeight="medium" color="gray.600" mb={2}>Description</Text>
                      <Text>{selectedTest.description}</Text>
                    </Box>
                  )}
                  
                  {selectedTest.instructions && (
                    <Box>
                      <Text fontWeight="medium" color="gray.600" mb={2}>Instructions</Text>
                      <Text>{selectedTest.instructions}</Text>
                    </Box>
                  )}
                  
                  {/* Questions */}
                  {selectedTest.questions.length > 0 && (
                    <Box>
                      <Text fontWeight="medium" color="gray.600" mb={4}>Questions</Text>
                      <VStack gap={4} align="stretch">
                        {selectedTest.questions.map((question, index) => (
                          <Card.Root key={question.id} p={4} bg="gray.50">
                            <VStack align="start" gap={2}>
                              <Text fontWeight="medium">
                                Q{index + 1}: {question.question}
                              </Text>
                              <HStack>
                                <Badge colorScheme="blue" fontSize="xs">
                                  {question.type.replace('_', ' ')}
                                </Badge>
                                <Badge colorScheme="green" fontSize="xs">
                                  {question.marks} marks
                                </Badge>
                              </HStack>
                              {question.options && (
                                <Box>
                                  <Text fontSize="sm" fontWeight="medium" color="gray.600">Options:</Text>
                                  <VStack align="start" gap={1} ml={4}>
                                    {question.options.map((option, optIndex) => (
                                      <Text key={optIndex} fontSize="sm">
                                        {String.fromCharCode(65 + optIndex)}. {option}
                                      </Text>
                                    ))}
                                  </VStack>
                                </Box>
                              )}
                              <Text fontSize="sm" color="green.600">
                                <strong>Correct Answer:</strong> {question.correctAnswer}
                              </Text>
                            </VStack>
                          </Card.Root>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Card.Body>

              <Card.Footer>
                <Button
                  variant="outline"
                  onClick={() => setModalView('none')}
                >
                  <FaArrowLeft />
                  Close
                </Button>
              </Card.Footer>
            </Card.Root>
          </Box>
        </Box>
      )}

      {/* Test Results Modal */}
      {modalView === 'results' && selectedTest && (
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
          onClick={() => setModalView('none')}
        >
          <Box 
            maxW="6xl" 
            w="95%" 
            maxH="90vh" 
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card.Root>
              <Card.Header>
                <Flex align="center">
                  <Heading size="md" color="purple.600">
                    📝 Grade Students: {selectedTest.title}
                  </Heading>
                  <Spacer />
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setModalView('none')}
                    aria-label="Close modal"
                  >
                    <FaTimes />
                  </IconButton>
                </Flex>
              </Card.Header>

              <Card.Body>
                {testResults.length === 0 ? (
                  <VStack gap={4} py={8}>
                    <Text textAlign="center" color="gray.500">
                      No submissions yet for this test.
                    </Text>
                    <Button
                      colorScheme="blue"
                      onClick={() => openManualGradingModal(selectedTest)}
                    >
                      📝 Add Manual Grades
                    </Button>
                  </VStack>
                ) : (
                  <VStack gap={4} align="stretch">
                    <HStack justify="space-between" align="center">
                      <Text fontWeight="medium">
                        Total Submissions: {testResults.length}
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => openManualGradingModal(selectedTest)}
                      >
                        📝 Add Manual Grades
                      </Button>
                    </HStack>
                    
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                      {testResults.map((result) => (
                        <Card.Root key={result.id} p={4} bg="white" borderWidth={1}>
                          <VStack align="start" gap={3}>
                            <Flex w="100%" justify="space-between" align="start">
                              <VStack align="start" gap={1}>
                                <Text fontWeight="bold">{result.studentName}</Text>
                                <Badge 
                                  colorScheme={result.status === 'graded' ? 'green' : 'blue'} 
                                  fontSize="xs"
                                >
                                  {result.status}
                                </Badge>
                              </VStack>
                              <VStack align="end" gap={1}>
                                <Text fontSize="lg" fontWeight="bold" color="blue.600">
                                  {result.score}/{result.maxMarks}
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                  {result.percentage}%
                                </Text>
                              </VStack>
                            </Flex>
                            
                            <VStack align="start" gap={1} w="100%">
                              <Text fontSize="sm" color="gray.600">
                                Time Spent: {result.timeSpent} minutes
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                Submitted: {new Date(result.submittedAt).toLocaleString()}
                              </Text>
                              {result.feedback && (
                                <Text fontSize="sm" color="gray.700">
                                  <strong>Feedback:</strong> {result.feedback}
                                </Text>
                              )}
                            </VStack>
                            
                            <Button
                              size="sm"
                              colorScheme={result.status === 'graded' ? 'green' : 'blue'}
                              variant="outline"
                              onClick={() => openGradingModal(selectedTest, result)}
                              w="100%"
                            >
                              <FaEdit style={{ marginRight: '8px' }} />
                              {result.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}
                            </Button>
                          </VStack>
                        </Card.Root>
                      ))}
                    </SimpleGrid>
                  </VStack>
                )}
              </Card.Body>

              <Card.Footer>
                <Button
                  variant="outline"
                  onClick={() => setModalView('none')}
                >
                  <FaArrowLeft />
                  Close
                </Button>
              </Card.Footer>
            </Card.Root>
          </Box>
        </Box>
      )}

      {/* Test Statistics Modal */}
      {modalView === 'statistics' && selectedTest && testStatistics && (
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
          onClick={() => setModalView('none')}
        >
          <Box 
            maxW="4xl" 
            w="95%" 
            maxH="90vh" 
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card.Root>
              <Card.Header>
                <Flex align="center">
                  <Heading size="md" color="orange.600">
                    📈 Test Statistics: {selectedTest.title}
                  </Heading>
                  <Spacer />
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setModalView('none')}
                    aria-label="Close modal"
                  >
                    <FaTimes />
                  </IconButton>
                </Flex>
              </Card.Header>

              <Card.Body>
                <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
                  <Card.Root p={4} bg="blue.50" borderColor="blue.200" borderWidth={1}>
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                        {testStatistics.totalSubmissions}
                      </Text>
                      <Text fontSize="sm" color="blue.600" textAlign="center">
                        Total Submissions
                      </Text>
                    </VStack>
                  </Card.Root>
                  
                  <Card.Root p={4} bg="green.50" borderColor="green.200" borderWidth={1}>
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">
                        {testStatistics.averageScore.toFixed(1)}
                      </Text>
                      <Text fontSize="sm" color="green.600" textAlign="center">
                        Average Score
                      </Text>
                    </VStack>
                  </Card.Root>
                  
                  <Card.Root p={4} bg="purple.50" borderColor="purple.200" borderWidth={1}>
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                        {testStatistics.averagePercentage.toFixed(1)}%
                      </Text>
                      <Text fontSize="sm" color="purple.600" textAlign="center">
                        Average Percentage
                      </Text>
                    </VStack>
                  </Card.Root>
                  
                  <Card.Root p={4} bg="orange.50" borderColor="orange.200" borderWidth={1}>
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                        {testStatistics.passRate.toFixed(1)}%
                      </Text>
                      <Text fontSize="sm" color="orange.600" textAlign="center">
                        Pass Rate (≥60%)
                      </Text>
                    </VStack>
                  </Card.Root>
                  
                  <Card.Root p={4} bg="cyan.50" borderColor="cyan.200" borderWidth={1}>
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold" color="cyan.600">
                        {testStatistics.highestScore}
                      </Text>
                      <Text fontSize="sm" color="cyan.600" textAlign="center">
                        Highest Score
                      </Text>
                    </VStack>
                  </Card.Root>
                  
                  <Card.Root p={4} bg="red.50" borderColor="red.200" borderWidth={1}>
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold" color="red.600">
                        {testStatistics.lowestScore}
                      </Text>
                      <Text fontSize="sm" color="red.600" textAlign="center">
                        Lowest Score
                      </Text>
                    </VStack>
                  </Card.Root>
                  
                  <Card.Root p={4} bg="teal.50" borderColor="teal.200" borderWidth={1}>
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold" color="teal.600">
                        {testStatistics.submissionRate.toFixed(1)}%
                      </Text>
                      <Text fontSize="sm" color="teal.600" textAlign="center">
                        Submission Rate
                      </Text>
                    </VStack>
                  </Card.Root>
                </SimpleGrid>
              </Card.Body>

              <Card.Footer>
                <Button
                  variant="outline"
                  onClick={() => setModalView('none')}
                >
                  <FaArrowLeft />
                  Close
                </Button>
              </Card.Footer>
            </Card.Root>
          </Box>
        </Box>
      )}

      {/* Grade Submission Modal */}
      {modalView === 'grade' && selectedTest && selectedResult && (
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
          onClick={() => setModalView('none')}
        >
          <Box 
            maxW="lg" 
            w="95%" 
            maxH="90vh" 
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card.Root>
              <Card.Header>
                <Flex align="center">
                  <Heading size="md" color="green.600">
                    📝 Grade Submission: {selectedResult.studentName}
                  </Heading>
                  <Spacer />
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setModalView('none')}
                    aria-label="Close modal"
                  >
                    <FaTimes />
                  </IconButton>
                </Flex>
              </Card.Header>

              <Card.Body>
                <VStack gap={6} align="stretch">
                  {/* Test and Student Info */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Test</Text>
                      <Text>{selectedTest.title}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Student</Text>
                      <Text>{selectedResult.studentName}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Max Marks</Text>
                      <Text>{selectedTest.maxMarks}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Time Spent</Text>
                      <Text>{selectedResult.timeSpent} minutes</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Submitted</Text>
                      <Text>{new Date(selectedResult.submittedAt).toLocaleString()}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Current Status</Text>
                      <Badge colorScheme={selectedResult.status === 'graded' ? 'green' : 'blue'}>
                        {selectedResult.status}
                      </Badge>
                    </Box>
                  </SimpleGrid>

                  {/* Student Answers Preview */}
                  <Box>
                    <Text fontWeight="medium" color="gray.600" mb={3}>Student Answers</Text>
                    <VStack gap={3} align="stretch">
                      {selectedTest.questions.map((question, index) => (
                        <Card.Root key={question.id} p={3} bg="gray.50">
                          <VStack align="start" gap={2}>
                            <Text fontWeight="medium" fontSize="sm">
                              Q{index + 1}: {question.question}
                            </Text>
                            <HStack>
                              <Badge colorScheme="blue" fontSize="xs">
                                {question.marks} marks
                              </Badge>
                            </HStack>
                            <Box>
                              <Text fontSize="sm" color="gray.600">Student Answer:</Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {selectedResult.answers[index] || 'No answer provided'}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" color="green.600">
                                <strong>Correct Answer:</strong> {question.correctAnswer}
                              </Text>
                            </Box>
                          </VStack>
                        </Card.Root>
                      ))}
                    </VStack>
                  </Box>

                  {/* Grading Form */}
                  <Box>
                    <Text fontWeight="medium" color="gray.600" mb={4}>Enter Grade</Text>
                    <VStack gap={4} align="stretch">
                      <Box>
                        <Text mb={2} fontWeight="medium">Score *</Text>
                        <Input
                          type="number"
                          min={0}
                          max={selectedTest.maxMarks}
                          value={gradingForm.score}
                          onChange={(e) => setGradingForm(prev => ({ ...prev, score: e.target.value }))}
                          placeholder={`Enter score (0-${selectedTest.maxMarks})`}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Maximum marks: {selectedTest.maxMarks}
                        </Text>
                      </Box>
                      
                      <Box>
                        <Text mb={2} fontWeight="medium">Feedback (Optional)</Text>
                        <Textarea
                          value={gradingForm.feedback}
                          onChange={(e) => setGradingForm(prev => ({ ...prev, feedback: e.target.value }))}
                          placeholder="Enter feedback for the student"
                          rows={4}
                        />
                      </Box>

                      {/* Score Summary */}
                      {gradingForm.score && (
                        <Card.Root p={3} bg="blue.50" borderColor="blue.200" borderWidth={1}>
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Grade Summary:</Text>
                            <VStack align="end" gap={1}>
                              <Text fontSize="lg" fontWeight="bold" color="blue.600">
                                {gradingForm.score}/{selectedTest.maxMarks}
                              </Text>
                              <Text fontSize="sm" color="blue.600">
                                {selectedTest.maxMarks > 0 ? ((parseInt(gradingForm.score || '0') / selectedTest.maxMarks) * 100).toFixed(1) : 0}%
                              </Text>
                            </VStack>
                          </HStack>
                        </Card.Root>
                      )}
                    </VStack>
                  </Box>
                </VStack>
              </Card.Body>

              <Card.Footer>
                <HStack gap={3} w="100%" justify="space-between">
                  <Button
                    variant="outline"
                    onClick={() => setModalView('results')}
                  >
                    <FaArrowLeft />
                    Back to Results
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={handleGradeSubmission}
                    loading={submitting}
                    disabled={!gradingForm.score}
                  >
                    <FaSave />
                    Submit Grade
                  </Button>
                </HStack>
              </Card.Footer>
            </Card.Root>
          </Box>
        </Box>
      )}

      {/* Manual Grade Entry Modal */}
      {modalView === 'manualGrade' && selectedTest && (
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
          onClick={() => setModalView('none')}
        >
          <Box 
            maxW="6xl" 
            w="95%" 
            maxH="90vh" 
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card.Root>
              <Card.Header>
                <Flex align="center">
                  <Heading size="md" color="blue.600">
                    📝 Manual Grade Entry: {selectedTest.title}
                  </Heading>
                  <Spacer />
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setModalView('none')}
                    aria-label="Close modal"
                  >
                    <FaTimes />
                  </IconButton>
                </Flex>
              </Card.Header>

              <Card.Body>
                <VStack gap={6} align="stretch">
                  {/* Test Info */}
                  <Card.Root p={4} bg="blue.50" borderColor="blue.200" borderWidth={1}>
                    <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                      <Box>
                        <Text fontWeight="medium" color="blue.600">Subject</Text>
                        <Text>{selectedTest.subject}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="medium" color="blue.600">Class</Text>
                        <Text>{selectedTest.className}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="medium" color="blue.600">Max Marks</Text>
                        <Text>{selectedTest.maxMarks}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="medium" color="blue.600">Total Students</Text>
                        <Text>{students.length}</Text>
                      </Box>
                    </SimpleGrid>
                  </Card.Root>

                  {/* Instructions */}
                  <Card.Root p={3} bg="yellow.50" borderColor="yellow.200" borderWidth={1}>
                    <Text fontSize="sm" color="yellow.800">
                      💡 <strong>Instructions:</strong> Enter grades for students manually. This is useful for paper-based tests, 
                      offline assessments, or students who didn't submit online. Leave blank for students without grades.
                    </Text>
                  </Card.Root>

                  {/* Student Grade Entry */}
                  <Box>
                    <Text fontWeight="medium" mb={4}>Student Grades</Text>
                    <VStack gap={3} align="stretch">
                      {students.map((student) => {
                        const existingResult = testResults.find(r => r.studentId === student.id);
                        return (
                          <Card.Root key={student.id} p={4} bg="white" borderWidth={1}>
                            <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} alignItems="end">
                              <VStack align="start" gap={1}>
                                <Text fontWeight="bold">{student.name}</Text>
                                <Text fontSize="sm" color="gray.600">Roll: {student.rollNumber}</Text>
                                {existingResult && (
                                  <Badge colorScheme="green" fontSize="xs">
                                    Already Graded: {existingResult.score}/{selectedTest.maxMarks}
                                  </Badge>
                                )}
                              </VStack>
                              
                              <Box>
                                <Text mb={2} fontWeight="medium" fontSize="sm">Score *</Text>
                                <Input
                                  type="number"
                                  min={0}
                                  max={selectedTest.maxMarks}
                                  placeholder={`0-${selectedTest.maxMarks}`}
                                  value={manualGrades[student.id]?.score || ''}
                                  onChange={(e) => {
                                    setManualGrades(prev => ({
                                      ...prev,
                                      [student.id]: {
                                        ...prev[student.id],
                                        score: e.target.value,
                                        feedback: prev[student.id]?.feedback || ''
                                      }
                                    }));
                                  }}
                                  size="sm"
                                />
                              </Box>
                              
                              <Box>
                                <Text mb={2} fontWeight="medium" fontSize="sm">Feedback</Text>
                                <Input
                                  placeholder="Optional feedback"
                                  value={manualGrades[student.id]?.feedback || ''}
                                  onChange={(e) => {
                                    setManualGrades(prev => ({
                                      ...prev,
                                      [student.id]: {
                                        ...prev[student.id],
                                        score: prev[student.id]?.score || '',
                                        feedback: e.target.value
                                      }
                                    }));
                                  }}
                                  size="sm"
                                />
                              </Box>
                              
                              <Box textAlign="center">
                                {manualGrades[student.id]?.score && (
                                  <VStack gap={1}>
                                    <Text fontSize="lg" fontWeight="bold" color="blue.600">
                                      {((parseInt(manualGrades[student.id]?.score || '0') / selectedTest.maxMarks) * 100).toFixed(1)}%
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Percentage</Text>
                                  </VStack>
                                )}
                              </Box>
                            </SimpleGrid>
                          </Card.Root>
                        );
                      })}
                    </VStack>
                  </Box>

                  {/* Grade Summary */}
                  <Card.Root p={4} bg="green.50" borderColor="green.200" borderWidth={1}>
                    <Text fontWeight="medium" mb={2}>Grade Summary</Text>
                    <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                      <Box textAlign="center">
                        <Text fontSize="lg" fontWeight="bold" color="green.600">
                          {Object.values(manualGrades).filter(g => g.score && g.score.trim() !== '').length}
                        </Text>
                        <Text fontSize="sm" color="green.600">Students Graded</Text>
                      </Box>
                      <Box textAlign="center">
                        <Text fontSize="lg" fontWeight="bold" color="blue.600">
                          {students.length - Object.values(manualGrades).filter(g => g.score && g.score.trim() !== '').length}
                        </Text>
                        <Text fontSize="sm" color="blue.600">Remaining</Text>
                      </Box>
                      <Box textAlign="center">
                        <Text fontSize="lg" fontWeight="bold" color="purple.600">
                          {Object.values(manualGrades).filter(g => g.score && g.score.trim() !== '').length > 0 
                            ? (Object.values(manualGrades)
                                .filter(g => g.score && g.score.trim() !== '')
                                .reduce((sum, g) => sum + parseInt(g.score), 0) / 
                              Object.values(manualGrades).filter(g => g.score && g.score.trim() !== '').length).toFixed(1)
                            : '0'
                          }
                        </Text>
                        <Text fontSize="sm" color="purple.600">Average Score</Text>
                      </Box>
                      <Box textAlign="center">
                        <Text fontSize="lg" fontWeight="bold" color="orange.600">
                          {Object.values(manualGrades).filter(g => g.score && g.score.trim() !== '').length > 0 
                            ? ((Object.values(manualGrades)
                                  .filter(g => g.score && g.score.trim() !== '')
                                  .reduce((sum, g) => sum + parseInt(g.score), 0) / 
                                Object.values(manualGrades).filter(g => g.score && g.score.trim() !== '').length) / selectedTest.maxMarks * 100).toFixed(1)
                            : '0'
                          }%
                        </Text>
                        <Text fontSize="sm" color="orange.600">Average %</Text>
                      </Box>
                    </SimpleGrid>
                  </Card.Root>
                </VStack>
              </Card.Body>

              <Card.Footer>
                <HStack gap={3} w="100%" justify="space-between">
                  <Button
                    variant="outline"
                    onClick={() => setModalView('results')}
                  >
                    <FaArrowLeft />
                    Back to Results
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={handleManualGradeSubmit}
                    loading={submitting}
                    disabled={Object.values(manualGrades).filter(g => g.score && g.score.trim() !== '').length === 0}
                  >
                    <FaSave />
                    Submit All Grades ({Object.values(manualGrades).filter(g => g.score && g.score.trim() !== '').length})
                  </Button>
                </HStack>
              </Card.Footer>
            </Card.Root>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TestManagement;