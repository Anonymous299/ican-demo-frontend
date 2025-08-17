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
} from '@chakra-ui/react';
import { Progress } from '@chakra-ui/react';
import { 
  FaBook, 
  FaCalendarAlt, 
  FaClock, 
  FaPlay, 
  FaCheck,
  FaGraduationCap,
  FaTrophy,
  FaChartLine,
  FaClipboardList,
  FaArrowLeft
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
  createdByName: string;
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

type StudentView = 'dashboard' | 'takeTest' | 'results' | 'profile';

// Test Taking Interface Component
const TakeTestInterface: React.FC<{
  test: Test;
  onBack: () => void;
  onComplete: () => void;
}> = ({ test, onBack, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(test.duration * 60); // Convert minutes to seconds
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const toaster = createToaster({
    placement: 'top-right',
  });

  // Timer effect
  useEffect(() => {
    if (!testStarted || testCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, testCompleted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitTest = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('=== Frontend Debug ===');
      console.log('User from localStorage:', user);
      console.log('User has studentId:', !!user.studentId, 'Value:', user.studentId);
      console.log('Test:', test);
      console.log('Answers state:', answers);
      
      // Validate user has studentId
      if (!user.studentId) {
        throw new Error('Student ID not found in user data. Please log out and log back in.');
      }

      
      const submissionData = {
        answers: test.questions.map((q, index) => answers[q.id] || ''),
        timeSpent: (test.duration * 60) - timeLeft
      };

      console.log('Submission data:', submissionData);
      console.log('API URL:', `${API_BASE_URL}/api/tests/${test.id}/submit`);

      await axios.post(`${API_BASE_URL}/api/tests/${test.id}/submit`, submissionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTestCompleted(true);
      toaster.create({
        title: 'Test Submitted Successfully',
        description: 'Your answers have been recorded. Results will be available after grading.',
        status: 'success',
        duration: 5000,
      });

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        onComplete();
      }, 3000);

    } catch (error: any) {
      console.error('Error submitting test:', error);
      
      let errorMessage = 'Failed to submit test. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toaster.create({
        title: 'Submission Error',
        description: errorMessage,
        status: 'error',
        duration: 8000,
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  const getAnsweredQuestionsCount = () => {
    return Object.keys(answers).length;
  };


  const canNavigateNext = () => {
    return currentQuestionIndex < test.questions.length - 1;
  };

  const canNavigatePrevious = () => {
    return currentQuestionIndex > 0;
  };

  if (testCompleted) {
    return (
      <VStack gap={6} textAlign="center" py={8}>
        <Box color="green.500" fontSize="6xl">
          <FaCheck />
        </Box>
        <Heading size="lg" color="green.600">Test Submitted Successfully!</Heading>
        <Text color="gray.600">
          Your answers have been recorded. Results will be available after grading.
        </Text>
        <VStack gap={2}>
          <Text fontSize="sm">
            Questions Answered: {getAnsweredQuestionsCount()} / {test.questions.length}
          </Text>
          <Text fontSize="sm">
            Time Used: {formatTime((test.duration * 60) - timeLeft)} / {test.duration} minutes
          </Text>
        </VStack>
        <Button onClick={onComplete} colorScheme="green">
          Return to Dashboard
        </Button>
      </VStack>
    );
  }

  if (!testStarted) {
    return (
      <VStack gap={6} align="stretch" maxW="md" mx="auto">
        <Card.Root>
          <Card.Header>
            <VStack align="start" gap={2}>
              <Heading size="lg" color="blue.600">{test.title}</Heading>
              <Text color="gray.600">{test.subject}</Text>
            </VStack>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align="stretch">
              <Text fontSize="sm" color="gray.700">
                {test.description}
              </Text>
              
              <SimpleGrid columns={2} gap={4}>
                <Box textAlign="center">
                  <Text fontSize="sm" color="gray.600">Duration</Text>
                  <Text fontWeight="bold">{test.duration} minutes</Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="sm" color="gray.600">Total Marks</Text>
                  <Text fontWeight="bold">{test.maxMarks}</Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="sm" color="gray.600">Questions</Text>
                  <Text fontWeight="bold">{test.questions.length}</Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="sm" color="gray.600">Test Type</Text>
                  <Text fontWeight="bold" textTransform="capitalize">{test.testType.replace('_', ' ')}</Text>
                </Box>
              </SimpleGrid>

              {test.instructions && (
                <Box>
                  <Text fontWeight="medium" mb={2}>Instructions:</Text>
                  <Text fontSize="sm" color="gray.700" bg="gray.50" p={3} borderRadius="md">
                    {test.instructions}
                  </Text>
                </Box>
              )}

              <VStack gap={3} pt={4}>
                <Button 
                  colorScheme="blue" 
                  size="lg" 
                  w="100%"
                  onClick={() => setTestStarted(true)}
                >
                  <FaPlay style={{ marginRight: '8px' }} />
                  Start Test
                </Button>
                <Button variant="outline" onClick={onBack}>
                  <FaArrowLeft style={{ marginRight: '8px' }} />
                  Back to Dashboard
                </Button>
              </VStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];

  return (
    <VStack gap={4} align="stretch">
      {/* Header with timer and progress */}
      <Card.Root bg="blue.50" borderColor="blue.200">
        <Card.Body>
          <Flex justify="space-between" align="center">
            <VStack align="start" gap={1}>
              <Text fontWeight="bold" fontSize="lg">{test.title}</Text>
              <HStack>
                <Text fontSize="sm" color="gray.600">
                  Question {currentQuestionIndex + 1} of {test.questions.length}
                </Text>
                <Badge colorScheme="blue">
                  {getAnsweredQuestionsCount()} answered
                </Badge>
              </HStack>
            </VStack>
            
            <VStack align="end" gap={1}>
              <Text fontSize="lg" fontWeight="bold" color={timeLeft < 300 ? "red.500" : "blue.600"}>
                <FaClock style={{ display: 'inline', marginRight: '8px' }} />
                {formatTime(timeLeft)}
              </Text>
              <Progress.Root 
                value={(getAnsweredQuestionsCount() / test.questions.length) * 100} 
                colorScheme="blue"
                size="sm"
                w="120px"
              >
                <Progress.Track>
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            </VStack>
          </Flex>
        </Card.Body>
      </Card.Root>

      {/* Question */}
      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="start">
            <VStack align="start" gap={2} flex={1}>
              <Text fontSize="lg" fontWeight="medium">
                Question {currentQuestionIndex + 1}
              </Text>
              <Text color="gray.700">{currentQuestion.question}</Text>
            </VStack>
            <Badge colorScheme="purple">
              {currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'}
            </Badge>
          </Flex>
        </Card.Header>
        <Card.Body>
          <VStack gap={4} align="stretch">
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <VStack gap={3} align="stretch">
                {currentQuestion.options.map((option, index) => (
                  <Box
                    key={index}
                    p={3}
                    border="2px solid"
                    borderColor={answers[currentQuestion.id] === option ? "blue.500" : "gray.200"}
                    borderRadius="md"
                    cursor="pointer"
                    bg={answers[currentQuestion.id] === option ? "blue.50" : "white"}
                    _hover={{ borderColor: "blue.300", bg: "blue.25" }}
                    onClick={() => handleAnswerChange(currentQuestion.id, option)}
                  >
                    <HStack>
                      <Box
                        w={4}
                        h={4}
                        borderRadius="full"
                        border="2px solid"
                        borderColor={answers[currentQuestion.id] === option ? "blue.500" : "gray.300"}
                        bg={answers[currentQuestion.id] === option ? "blue.500" : "white"}
                      />
                      <Text>{option}</Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}

            {currentQuestion.type === 'short_answer' && (
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Short Answer (Recommended: 1-2 sentences)
                </Text>
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Type your answer here..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </Box>
            )}

            {currentQuestion.type === 'long_answer' && (
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Long Answer (Detailed response expected)
                </Text>
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Type your detailed answer here..."
                  style={{
                    width: '100%',
                    minHeight: '150px',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </Box>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Navigation */}
      <Flex justify="space-between" align="center" gap={4}>
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          disabled={!canNavigatePrevious()}
          opacity={canNavigatePrevious() ? 1 : 0.5}
        >
          <FaArrowLeft style={{ marginRight: '8px' }} />
          Previous
        </Button>

        <HStack gap={2}>
          {test.questions.map((_, index) => (
            <Button
              key={index}
              size="sm"
              variant={index === currentQuestionIndex ? 'solid' : 'outline'}
              colorScheme={answers[test.questions[index].id] ? 'green' : 'gray'}
              onClick={() => setCurrentQuestionIndex(index)}
              minW="40px"
            >
              {index + 1}
            </Button>
          ))}
        </HStack>

        {canNavigateNext() ? (
          <Button
            colorScheme="blue"
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
          >
            Next
            <FaArrowLeft style={{ marginLeft: '8px', transform: 'scaleX(-1)' }} />
          </Button>
        ) : (
          <Button
            colorScheme="green"
            onClick={() => setShowConfirmSubmit(true)}
          >
            Submit Test
            <FaCheck style={{ marginLeft: '8px' }} />
          </Button>
        )}
      </Flex>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
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
        >
          <Card.Root maxW="md" w="90%">
            <Card.Header>
              <Heading size="md">Submit Test?</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={4} align="stretch">
                <Text>
                  Are you sure you want to submit your test? You won't be able to make changes after submission.
                </Text>
                
                <Box bg="gray.50" p={3} borderRadius="md">
                  <VStack gap={2} align="start">
                    <Text fontSize="sm">
                      <strong>Questions Answered:</strong> {getAnsweredQuestionsCount()} / {test.questions.length}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Time Remaining:</strong> {formatTime(timeLeft)}
                    </Text>
                    {getAnsweredQuestionsCount() < test.questions.length && (
                      <Text fontSize="sm" color="orange.600">
                        ⚠️ You have {test.questions.length - getAnsweredQuestionsCount()} unanswered questions
                      </Text>
                    )}
                  </VStack>
                </Box>
                
                <HStack gap={3} justify="end">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmSubmit(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={handleSubmitTest}
                    loading={isSubmitting}
                    loadingText="Submitting..."
                  >
                    Submit Test
                  </Button>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Box>
      )}
    </VStack>
  );
};

// Results View Component  
const MyResultsView: React.FC<{
  results: TestResult[];
  tests: Test[];
  onBack: () => void;
}> = ({ results, tests, onBack }) => {
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'subject'>('date');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'graded' | 'submitted'>('all');

  const getUniqueSubjects = () => {
    const subjects = tests.map(test => test.subject);
    return Array.from(new Set(subjects));
  };

  const getFilteredAndSortedResults = () => {
    let filteredResults = [...results];

    // Filter by subject
    if (filterSubject !== 'all') {
      filteredResults = filteredResults.filter(result => {
        const test = tests.find(t => t.id === result.testId);
        return test && test.subject === filterSubject;
      });
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filteredResults = filteredResults.filter(result => result.status === filterStatus);
    }

    // Sort results
    filteredResults.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case 'score':
          return b.score - a.score;
        case 'subject':
          const testA = tests.find(t => t.id === a.testId);
          const testB = tests.find(t => t.id === b.testId);
          return (testA?.subject || '').localeCompare(testB?.subject || '');
        default:
          return 0;
      }
    });

    return filteredResults;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'green';
    if (percentage >= 80) return 'blue';
    if (percentage >= 70) return 'orange';
    if (percentage >= 60) return 'yellow';
    return 'red';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const calculateOverallStats = () => {
    if (results.length === 0) return { average: 0, highest: 0, lowest: 0 };
    
    const gradedResults = results.filter(r => r.status === 'graded');
    if (gradedResults.length === 0) return { average: 0, highest: 0, lowest: 0 };

    const percentages = gradedResults.map(r => parseFloat(r.percentage));
    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);

    return { average, highest, lowest };
  };

  const filteredResults = getFilteredAndSortedResults();
  const stats = calculateOverallStats();

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <VStack align="start" gap={1}>
              <Heading size="lg" color="blue.600">My Test Results</Heading>
              <Text color="gray.600">
                {results.length} total submissions • {results.filter(r => r.status === 'graded').length} graded
              </Text>
            </VStack>
            <Button variant="outline" onClick={onBack}>
              <FaArrowLeft style={{ marginRight: '8px' }} />
              Back to Dashboard
            </Button>
          </Flex>
        </Card.Header>
      </Card.Root>

      {/* Overall Statistics */}
      {results.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <Card.Root textAlign="center" p={4}>
            <VStack gap={2}>
              <Text fontSize="sm" color="gray.600">Average Score</Text>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                {stats.average.toFixed(1)}%
              </Text>
              <Badge colorScheme={getGradeColor(stats.average)} size="lg">
                Grade {getGradeLetter(stats.average)}
              </Badge>
            </VStack>
          </Card.Root>
          
          <Card.Root textAlign="center" p={4}>
            <VStack gap={2}>
              <Text fontSize="sm" color="gray.600">Highest Score</Text>
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {stats.highest.toFixed(1)}%
              </Text>
              <Badge colorScheme="green" size="lg">
                Grade {getGradeLetter(stats.highest)}
              </Badge>
            </VStack>
          </Card.Root>
          
          <Card.Root textAlign="center" p={4}>
            <VStack gap={2}>
              <Text fontSize="sm" color="gray.600">Lowest Score</Text>
              <Text fontSize="2xl" fontWeight="bold" color="red.600">
                {stats.lowest.toFixed(1)}%
              </Text>
              <Badge colorScheme="red" size="lg">
                Grade {getGradeLetter(stats.lowest)}
              </Badge>
            </VStack>
          </Card.Root>
        </SimpleGrid>
      )}

      {/* Filters and Sorting */}
      {results.length > 0 && (
        <Card.Root>
          <Card.Body>
            <Flex wrap="wrap" gap={4} align="center">
              <HStack>
                <Text fontSize="sm" fontWeight="medium">Sort by:</Text>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="date">Date</option>
                  <option value="score">Score</option>
                  <option value="subject">Subject</option>
                </select>
              </HStack>

              <HStack>
                <Text fontSize="sm" fontWeight="medium">Subject:</Text>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Subjects</option>
                  {getUniqueSubjects().map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </HStack>

              <HStack>
                <Text fontSize="sm" fontWeight="medium">Status:</Text>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All</option>
                  <option value="graded">Graded</option>
                  <option value="submitted">Pending</option>
                </select>
              </HStack>

              <Spacer />
              
              <Text fontSize="sm" color="gray.600">
                Showing {filteredResults.length} of {results.length} results
              </Text>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}

      {/* Results List */}
      {filteredResults.length === 0 ? (
        <Card.Root>
          <Card.Body textAlign="center" py={8}>
            <VStack gap={4}>
              <Box color="gray.400" fontSize="5xl">
                <FaClipboardList />
              </Box>
              <VStack gap={2}>
                <Text fontSize="lg" fontWeight="medium">No Results Found</Text>
                <Text color="gray.600">
                  {results.length === 0 
                    ? "You haven't taken any tests yet."
                    : "No results match your current filters."
                  }
                </Text>
              </VStack>
              {results.length === 0 && (
                <Button colorScheme="blue" onClick={onBack}>
                  Back to Dashboard
                </Button>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      ) : (
        <VStack gap={4} align="stretch">
          {filteredResults.map((result) => {
            const test = tests.find(t => t.id === result.testId);
            const percentage = parseFloat(result.percentage);
            
            return (
              <Card.Root key={result.id} borderWidth={2} borderColor="gray.200">
                <Card.Body>
                  <Flex justify="space-between" align="start" gap={4}>
                    <VStack align="start" gap={3} flex={1}>
                      <Flex justify="space-between" align="start" w="100%">
                        <VStack align="start" gap={1}>
                          <Text fontWeight="bold" fontSize="lg">
                            {test?.title || 'Unknown Test'}
                          </Text>
                          <HStack gap={4}>
                            <Badge colorScheme="purple">{test?.subject}</Badge>
                            <Badge colorScheme="gray" textTransform="capitalize">
                              {test?.testType?.replace('_', ' ')}
                            </Badge>
                            <Badge 
                              colorScheme={result.status === 'graded' ? 'green' : 'orange'}
                            >
                              {result.status === 'graded' ? 'Graded' : 'Pending Grade'}
                            </Badge>
                          </HStack>
                        </VStack>
                        
                        <VStack align="end" gap={1}>
                          <Text fontSize="2xl" fontWeight="bold" 
                                color={getGradeColor(percentage) + '.600'}>
                            {result.score}/{result.maxMarks}
                          </Text>
                          <Badge colorScheme={getGradeColor(percentage)} size="lg">
                            {percentage}% - {getGradeLetter(percentage)}
                          </Badge>
                        </VStack>
                      </Flex>
                      
                      <Progress.Root 
                        value={percentage} 
                        colorScheme={getGradeColor(percentage)}
                        size="md"
                        w="100%"
                      >
                        <Progress.Track>
                          <Progress.Range />
                        </Progress.Track>
                      </Progress.Root>
                      
                      <HStack justify="space-between" w="100%" fontSize="sm" color="gray.600">
                        <HStack>
                          <FaCalendarAlt />
                          <Text>Submitted: {new Date(result.submittedAt).toLocaleDateString()}</Text>
                        </HStack>
                        {result.timeSpent && (
                          <HStack>
                            <FaClock />
                            <Text>Time: {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s</Text>
                          </HStack>
                        )}
                        {result.status === 'graded' && result.gradedAt && (
                          <HStack>
                            <FaCheck />
                            <Text>Graded: {new Date(result.gradedAt).toLocaleDateString()}</Text>
                          </HStack>
                        )}
                      </HStack>
                      
                      {result.feedback && (
                        <Box bg="gray.50" p={3} borderRadius="md" w="100%">
                          <Text fontSize="sm" fontWeight="medium" mb={1}>Teacher Feedback:</Text>
                          <Text fontSize="sm" color="gray.700" fontStyle="italic">
                            "{result.feedback}"
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </Flex>
                </Card.Body>
              </Card.Root>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
};

// Student Profile Component
const StudentProfile: React.FC<{
  student: Student | null;
  stats: any;
  onBack: () => void;
}> = ({ student, stats, onBack }) => {
  if (!student) {
    return (
      <Card.Root>
        <Card.Body textAlign="center" py={8}>
          <Text color="red.600">Student information not available</Text>
          <Button mt={4} onClick={onBack}>Back to Dashboard</Button>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <VStack align="start" gap={1}>
              <Heading size="lg" color="blue.600">My Profile</Heading>
              <Text color="gray.600">Personal information and academic progress</Text>
            </VStack>
            <Button variant="outline" onClick={onBack}>
              <FaArrowLeft style={{ marginRight: '8px' }} />
              Back to Dashboard
            </Button>
          </Flex>
        </Card.Header>
      </Card.Root>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        {/* Personal Information */}
        <Card.Root>
          <Card.Header>
            <Heading size="md" color="green.600">
              <FaGraduationCap style={{ display: 'inline', marginRight: '8px' }} />
              Personal Information
            </Heading>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">Full Name:</Text>
                <Text>{student.name}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="medium">Class:</Text>
                <Badge colorScheme="blue" size="lg">{student.class}</Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="medium">Roll Number:</Text>
                <Text fontFamily="mono" fontWeight="bold">{student.rollNumber}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="medium">Date of Birth:</Text>
                <Text>{new Date(student.dateOfBirth).toLocaleDateString()}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="medium">Age:</Text>
                <Text>{student.age} years</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="medium">Parent Contact:</Text>
                <Text>{student.parentContact}</Text>
              </HStack>
              
              {student.notes && (
                <Box>
                  <Text fontWeight="medium" mb={2}>Additional Notes:</Text>
                  <Text fontSize="sm" color="gray.700" bg="gray.50" p={3} borderRadius="md">
                    {student.notes}
                  </Text>
                </Box>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Academic Performance */}
        <Card.Root>
          <Card.Header>
            <Heading size="md" color="purple.600">
              <FaTrophy style={{ display: 'inline', marginRight: '8px' }} />
              Academic Performance
            </Heading>
          </Card.Header>
          <Card.Body>
            <VStack gap={4} align="stretch">
              <Box textAlign="center" p={4} bg="blue.50" borderRadius="md">
                <Text fontSize="sm" color="gray.600" mb={1}>Overall Average</Text>
                <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                  {stats.averagePercentage}%
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Based on {stats.completedTests} completed test{stats.completedTests !== 1 ? 's' : ''}
                </Text>
              </Box>
              
              <SimpleGrid columns={2} gap={4}>
                <Box textAlign="center" p={3} bg="green.50" borderRadius="md">
                  <Text fontSize="sm" color="gray.600" mb={1}>Tests Taken</Text>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {stats.completedTests}
                  </Text>
                </Box>
                
                <Box textAlign="center" p={3} bg="orange.50" borderRadius="md">
                  <Text fontSize="sm" color="gray.600" mb={1}>Progress</Text>
                  <Text fontSize="xl" fontWeight="bold" color="orange.600">
                    {stats.completedTests > 0 ? ((stats.completedTests / stats.totalTests) * 100).toFixed(0) : 0}%
                  </Text>
                </Box>
              </SimpleGrid>
              
              <Box>
                <Text fontWeight="medium" mb={2}>Performance Overview:</Text>
                <VStack gap={2} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm">Total Tests Available:</Text>
                    <Badge colorScheme="gray">{stats.totalTests}</Badge>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm">Tests Completed:</Text>
                    <Badge colorScheme="green">{stats.completedTests}</Badge>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm">Average Score:</Text>
                    <Badge colorScheme="blue">{stats.averageScore} points</Badge>
                  </Flex>
                </VStack>
              </Box>
              
              <Progress.Root 
                value={stats.completedTests > 0 ? (stats.completedTests / stats.totalTests) * 100 : 0} 
                colorScheme="blue"
                size="lg"
              >
                <Progress.Track>
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
              <Text fontSize="xs" color="gray.600" textAlign="center">
                Course Progress: {stats.completedTests} of {stats.totalTests} tests completed
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* Recent Activity */}
      <Card.Root>
        <Card.Header>
          <Heading size="md" color="orange.600">
            <FaChartLine style={{ display: 'inline', marginRight: '8px' }} />
            Academic Journey
          </Heading>
        </Card.Header>
        <Card.Body>
          <VStack gap={4} align="stretch">
            <Text color="gray.600">
              Welcome to your academic profile! Here you can track your progress and see how well you're doing in your studies.
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box textAlign="center" p={4} borderWidth={1} borderColor="blue.200" borderRadius="md">
                <Box color="blue.500" fontSize="2xl" mb={2}>
                  <FaBook />
                </Box>
                <Text fontWeight="bold" color="blue.600">Study Hard</Text>
                <Text fontSize="sm" color="gray.600">
                  Keep learning and growing every day
                </Text>
              </Box>
              
              <Box textAlign="center" p={4} borderWidth={1} borderColor="green.200" borderRadius="md">
                <Box color="green.500" fontSize="2xl" mb={2}>
                  <FaCheck />
                </Box>
                <Text fontWeight="bold" color="green.600">Take Tests</Text>
                <Text fontSize="sm" color="gray.600">
                  Complete assessments to show your knowledge
                </Text>
              </Box>
              
              <Box textAlign="center" p={4} borderWidth={1} borderColor="purple.200" borderRadius="md">
                <Box color="purple.500" fontSize="2xl" mb={2}>
                  <FaTrophy />
                </Box>
                <Text fontWeight="bold" color="purple.600">Achieve Goals</Text>
                <Text fontSize="sm" color="gray.600">
                  Work towards your academic objectives
                </Text>
              </Box>
            </SimpleGrid>
            
            <Box p={4} bg="gradient-to-r from-blue-50 to-purple-50" borderRadius="md">
              <Text fontWeight="bold" color="blue.700" mb={2}>Keep Going! 🌟</Text>
              <Text fontSize="sm" color="gray.700">
                Every test you take and every lesson you learn brings you one step closer to your goals. 
                Stay curious, stay motivated, and remember that learning is a wonderful journey!
              </Text>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
};

const StudentDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<StudentView>('dashboard');
  const [tests, setTests] = useState<Test[]>([]);
  const [myResults, setMyResults] = useState<TestResult[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  const toaster = createToaster({
    placement: 'top-right',
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchStudentData();
      await fetchAvailableTests();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (tests.length > 0) {
      fetchMyResults(tests);
    }
  }, [tests]);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (user.role === 'student' && user.studentId) {
        const response = await axios.get(`${API_BASE_URL}/api/students/${user.studentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudent(response.data);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchAvailableTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/tests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter only published tests
      const publishedTests = response.data.filter((test: Test) => test.status === 'published');
      setTests(publishedTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to fetch available tests',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchMyResults = async (testsToCheck?: Test[]) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (user.role === 'student' && user.studentId) {
        const allResults: TestResult[] = [];
        const testsArray = testsToCheck || tests;
        
        // If no tests provided, get all published tests first
        if (testsArray.length === 0) {
          const testsResponse = await axios.get(`${API_BASE_URL}/api/tests`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const publishedTests = testsResponse.data.filter((test: Test) => test.status === 'published');
          
          for (const test of publishedTests) {
            try {
              const response = await axios.get(`${API_BASE_URL}/api/tests/${test.id}/results`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              allResults.push(...response.data);
            } catch (error) {
              // Ignore errors for individual tests
            }
          }
        } else {
          for (const test of testsArray) {
            try {
              const response = await axios.get(`${API_BASE_URL}/api/tests/${test.id}/results`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              allResults.push(...response.data);
            } catch (error) {
              // Ignore errors for individual tests
            }
          }
        }
        
        setMyResults(allResults.filter(result => result.studentId === user.studentId));
      }
    } catch (error) {
      console.error('Error fetching my results:', error);
    }
  };

  const getTestStatus = (test: Test) => {
    const result = myResults.find(r => r.testId === test.id);
    if (result) {
      return result.status === 'graded' ? 'completed' : 'submitted';
    }
    
    const testDate = new Date(test.scheduledDate);
    const now = new Date();
    
    if (testDate > now) {
      return 'upcoming';
    } else {
      return 'available';
    }
  };


  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'green';
    if (percentage >= 80) return 'blue';
    if (percentage >= 70) return 'orange';
    if (percentage >= 60) return 'yellow';
    return 'red';
  };

  const calculateOverallStats = () => {
    if (myResults.length === 0) {
      return { averageScore: 0, totalTests: 0, completedTests: 0, averagePercentage: 0 };
    }

    const completedResults = myResults.filter(r => r.status === 'graded');
    const totalScore = completedResults.reduce((sum, r) => sum + r.score, 0);
    const totalMaxMarks = completedResults.reduce((sum, r) => sum + r.maxMarks, 0);
    
    return {
      averageScore: completedResults.length > 0 ? (totalScore / completedResults.length).toFixed(1) : 0,
      totalTests: tests.length,
      completedTests: completedResults.length,
      averagePercentage: totalMaxMarks > 0 ? ((totalScore / totalMaxMarks) * 100).toFixed(1) : 0
    };
  };

  const renderDashboard = () => {
    const stats = calculateOverallStats();
    const upcomingTests = tests.filter(test => getTestStatus(test) === 'upcoming').slice(0, 3);
    const availableTests = tests.filter(test => getTestStatus(test) === 'available').slice(0, 3);
    const recentResults = myResults.filter(r => r.status === 'graded').slice(0, 3);

    return (
      <VStack align="stretch" gap={6}>
        {/* Welcome Header */}
        <Card.Root p={6} bg="gradient-to-r from-blue-500 to-purple-600" color="white">
          <Flex align="center" justify="space-between">
            <VStack align="start" gap={2}>
              <Heading size="lg">Welcome back, {student?.name}!</Heading>
              <Text opacity={0.9}>Class: {student?.class} • Roll No: {student?.rollNumber}</Text>
            </VStack>
            <FaGraduationCap size={48} opacity={0.7} />
          </Flex>
        </Card.Root>

        {/* Stats Overview */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <Card.Root p={4} textAlign="center">
            <VStack gap={1}>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">{stats.totalTests}</Text>
              <Text fontSize="sm" color="gray.600">Total Tests</Text>
            </VStack>
          </Card.Root>
          
          <Card.Root p={4} textAlign="center">
            <VStack gap={1}>
              <Text fontSize="2xl" fontWeight="bold" color="green.600">{stats.completedTests}</Text>
              <Text fontSize="sm" color="gray.600">Completed</Text>
            </VStack>
          </Card.Root>
          
          <Card.Root p={4} textAlign="center">
            <VStack gap={1}>
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">{stats.averagePercentage}%</Text>
              <Text fontSize="sm" color="gray.600">Average Score</Text>
            </VStack>
          </Card.Root>
          
          <Card.Root p={4} textAlign="center">
            <VStack gap={1}>
              <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                {stats.completedTests > 0 ? ((stats.completedTests / stats.totalTests) * 100).toFixed(0) : 0}%
              </Text>
              <Text fontSize="sm" color="gray.600">Progress</Text>
            </VStack>
          </Card.Root>
        </SimpleGrid>

        {/* Available Tests */}
        {availableTests.length > 0 && (
          <Box>
            <Heading size="md" mb={4} color="orange.600">
              📋 Available Tests
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {availableTests.map((test) => (
                <Card.Root key={test.id} p={4} borderWidth={2} borderColor="orange.200">
                  <VStack align="start" gap={3}>
                    <Flex w="100%" justify="space-between" align="start">
                      <VStack align="start" gap={1}>
                        <Text fontWeight="bold" fontSize="sm" lineClamp={2}>{test.title}</Text>
                        <Text fontSize="xs" color="gray.600">{test.subject}</Text>
                      </VStack>
                      <Badge colorScheme="orange" fontSize="xs">Available</Badge>
                    </Flex>
                    
                    <VStack align="start" gap={1} w="100%">
                      <HStack>
                        <FaCalendarAlt />
                        <Text fontSize="xs">{new Date(test.scheduledDate).toLocaleDateString()}</Text>
                      </HStack>
                      <HStack>
                        <FaClock />
                        <Text fontSize="xs">{test.duration} minutes</Text>
                      </HStack>
                      <HStack>
                        <FaTrophy />
                        <Text fontSize="xs">{test.maxMarks} marks</Text>
                      </HStack>
                    </VStack>
                    
                    <Button
                      size="sm"
                      colorScheme="orange"
                      w="100%"
                      onClick={() => {
                        setSelectedTest(test);
                        setCurrentView('takeTest');
                      }}
                    >
                      <FaPlay style={{ marginRight: '8px' }} />
                      Take Test
                    </Button>
                  </VStack>
                </Card.Root>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Upcoming Tests */}
        {upcomingTests.length > 0 && (
          <Box>
            <Heading size="md" mb={4} color="purple.600">
              📅 Upcoming Tests
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {upcomingTests.map((test) => (
                <Card.Root key={test.id} p={4} borderWidth={2} borderColor="purple.200">
                  <VStack align="start" gap={3}>
                    <Flex w="100%" justify="space-between" align="start">
                      <VStack align="start" gap={1}>
                        <Text fontWeight="bold" fontSize="sm" lineClamp={2}>{test.title}</Text>
                        <Text fontSize="xs" color="gray.600">{test.subject}</Text>
                      </VStack>
                      <Badge colorScheme="purple" fontSize="xs">Upcoming</Badge>
                    </Flex>
                    
                    <VStack align="start" gap={1} w="100%">
                      <HStack>
                        <FaCalendarAlt />
                        <Text fontSize="xs">{new Date(test.scheduledDate).toLocaleDateString()}</Text>
                      </HStack>
                      <HStack>
                        <FaClock />
                        <Text fontSize="xs">{test.duration} minutes</Text>
                      </HStack>
                      <HStack>
                        <FaTrophy />
                        <Text fontSize="xs">{test.maxMarks} marks</Text>
                      </HStack>
                    </VStack>
                    
                    <Text fontSize="xs" color="gray.500" textAlign="center" w="100%">
                      Available on {new Date(test.scheduledDate).toLocaleDateString()}
                    </Text>
                  </VStack>
                </Card.Root>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <Box>
            <Heading size="md" mb={4} color="green.600">
              🏆 Recent Results
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {recentResults.map((result) => {
                const test = tests.find(t => t.id === result.testId);
                return (
                  <Card.Root key={result.id} p={4} borderWidth={2} borderColor="green.200">
                    <VStack align="start" gap={3}>
                      <Flex w="100%" justify="space-between" align="start">
                        <VStack align="start" gap={1}>
                          <Text fontWeight="bold" fontSize="sm" lineClamp={2}>
                            {test?.title || 'Unknown Test'}
                          </Text>
                          <Text fontSize="xs" color="gray.600">{test?.subject}</Text>
                        </VStack>
                        <Badge colorScheme={getGradeColor(parseFloat(result.percentage))} fontSize="xs">
                          {result.percentage}%
                        </Badge>
                      </Flex>
                      
                      <VStack align="start" gap={1} w="100%">
                        <HStack justify="space-between" w="100%">
                          <Text fontSize="sm" fontWeight="medium">Score:</Text>
                          <Text fontSize="sm" fontWeight="bold" color="blue.600">
                            {result.score}/{result.maxMarks}
                          </Text>
                        </HStack>
                        
                        <Progress.Root 
                          value={parseFloat(result.percentage)} 
                          colorScheme={getGradeColor(parseFloat(result.percentage))}
                          size="sm"
                          w="100%"
                        >
                          <Progress.Track>
                            <Progress.Range />
                          </Progress.Track>
                        </Progress.Root>
                        
                        {result.feedback && (
                          <Text fontSize="xs" color="gray.600" fontStyle="italic">
                            "{result.feedback}"
                          </Text>
                        )}
                      </VStack>
                    </VStack>
                  </Card.Root>
                );
              })}
            </SimpleGrid>
          </Box>
        )}

        {/* Quick Actions */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <Button
            h="80px"
            flexDirection="column"
            gap={2}
            variant="outline"
            colorScheme="blue"
            onClick={() => setCurrentView('results')}
          >
            <FaChartLine size={24} />
            <Text fontSize="sm">View All Results</Text>
          </Button>
          
          <Button
            h="80px"
            flexDirection="column"
            gap={2}
            variant="outline"
            colorScheme="green"
            onClick={() => setCurrentView('profile')}
          >
            <FaGraduationCap size={24} />
            <Text fontSize="sm">My Profile</Text>
          </Button>
          
          <Button
            h="80px"
            flexDirection="column"
            gap={2}
            variant="outline"
            colorScheme="purple"
            onClick={() => {
              const availableTest = tests.find(test => getTestStatus(test) === 'available');
              if (availableTest) {
                setSelectedTest(availableTest);
                setCurrentView('takeTest');
              }
            }}
            disabled={!tests.some(test => getTestStatus(test) === 'available')}
          >
            <FaPlay size={24} />
            <Text fontSize="sm">Take Test</Text>
          </Button>
          
          <Button
            h="80px"
            flexDirection="column"
            gap={2}
            variant="outline"
            colorScheme="orange"
          >
            <FaBook size={24} />
            <Text fontSize="sm">Study Materials</Text>
          </Button>
        </SimpleGrid>
      </VStack>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'takeTest':
        return selectedTest ? (
          <TakeTestInterface 
            test={selectedTest} 
            onBack={() => setCurrentView('dashboard')}
            onComplete={() => {
              fetchMyResults(tests);
              setCurrentView('dashboard');
            }}
          />
        ) : renderDashboard();
      case 'results':
        return (
          <MyResultsView 
            results={myResults}
            tests={tests}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'profile':
        return (
          <StudentProfile 
            student={student}
            stats={calculateOverallStats()}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <Box>
      {currentView !== 'dashboard' && (
        <HStack mb={4}>
          <Button
            variant="outline"
            onClick={() => setCurrentView('dashboard')}
          >
            <FaArrowLeft />
            Back to Dashboard
          </Button>
        </HStack>
      )}
      
      <Heading mb={6} color="blue.600">
        Student Dashboard
      </Heading>
      
      {renderCurrentView()}
    </Box>
  );
};

export default StudentDashboard;

