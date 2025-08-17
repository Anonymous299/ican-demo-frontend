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
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { API_BASE_URL } from '../config/constants';

interface LessonPlan {
  id: number;
  title: string;
  teacher: string;
  teacherId: number;
  class: string;
  classId: number;
  subject: string;
  academicYear: string;
  lessons: Lesson[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Lesson {
  id: number;
  name: string;
  estimatedPeriods: number;
  learningOutcomes: string[];
  activities: Activity[];
}

interface Activity {
  id: number;
  name: string;
  activityType: 'Individual' | 'Group' | 'Homework';
  gradingType: 'Marks' | 'Rubric';
  description: string;
  materials: string[];
}

interface Teacher {
  id: number;
  name: string;
  subject: string;
  email: string;
}

interface Class {
  id: number;
  name: string;
  grade: string;
  division: string;
  subjects: string[];
}

const LessonPlanManagement: React.FC = () => {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal view states - only one modal open at a time
  const [modalView, setModalView] = useState<'none' | 'lessons' | 'editLesson' | 'editActivity'>('none');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingActivityIndex, setEditingActivityIndex] = useState<number | null>(null);

  const toaster = createToaster({
    placement: 'top-right',
  });

  // Form states
  const [planForm, setPlanForm] = useState({
    title: '',
    teacherId: '',
    classId: '',
    subject: '',
    academicYear: '2024-25'
  });

  const [lessonForm, setLessonForm] = useState({
    name: '',
    estimatedPeriods: 1,
    learningOutcomes: [''],
    activities: [] as Activity[]
  });

  const [activityForm, setActivityForm] = useState({
    name: '',
    activityType: 'Individual' as Activity['activityType'],
    gradingType: 'Marks' as Activity['gradingType'],
    description: '',
    materials: ['']
  });

  const SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Art & Craft', 'Music', 'Physical Education'];

  useEffect(() => {
    fetchPlans();
    fetchTeachers();
    fetchClasses();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/curriculum`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to fetch lesson plans',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/teachers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
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

  const handleViewLessons = (plan: LessonPlan) => {
    setSelectedPlan(plan);
    setModalView('lessons');
  };

  const handleCreatePlan = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const selectedTeacher = teachers.find(t => t.id === parseInt(planForm.teacherId));
      const selectedClass = classes.find(c => c.id === parseInt(planForm.classId));
      
      if (!selectedTeacher || !selectedClass) {
        toaster.create({
          title: 'Error',
          description: 'Please select valid teacher and class',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const payload = {
        title: planForm.title,
        teacher: selectedTeacher.name,
        teacherId: selectedTeacher.id,
        class: selectedClass.name,
        classId: selectedClass.id,
        subject: planForm.subject,
        academicYear: planForm.academicYear,
        lessons: []
      };

      await axios.post(`${API_BASE_URL}/api/curriculum`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      await fetchPlans();
      setShowAddPlanModal(false);
      resetPlanForm();
      toaster.create({
        title: 'Success',
        description: 'Lesson plan created successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to create lesson plan',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (window.confirm('Are you sure you want to delete this lesson plan? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/curriculum/${planId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchPlans();
        toaster.create({
          title: 'Success',
          description: 'Lesson plan deleted successfully',
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('Error deleting lesson plan:', error);
        toaster.create({
          title: 'Error',
          description: 'Failed to delete lesson plan',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  const handleAddLesson = () => {
    setEditingLesson(null);
    resetLessonForm();
    setModalView('editLesson');
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      name: lesson.name,
      estimatedPeriods: lesson.estimatedPeriods,
      learningOutcomes: [...lesson.learningOutcomes],
      activities: [...lesson.activities]
    });
    setModalView('editLesson');
  };

  const handleBackToLessons = () => {
    setModalView('lessons');
    setEditingLesson(null);
    resetLessonForm();
  };

  const handleCloseModal = () => {
    setModalView('none');
    setSelectedPlan(null);
    setEditingLesson(null);
    resetLessonForm();
  };

  const handleSaveLesson = async () => {
    if (!selectedPlan) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const newLesson = {
        id: editingLesson?.id || Date.now(),
        name: lessonForm.name,
        estimatedPeriods: lessonForm.estimatedPeriods,
        learningOutcomes: lessonForm.learningOutcomes.filter(o => o.trim()),
        activities: lessonForm.activities
      };

      const updatedLessons = editingLesson 
        ? selectedPlan.lessons.map(l => l.id === editingLesson.id ? newLesson : l)
        : [...selectedPlan.lessons, newLesson];

      await axios.put(`${API_BASE_URL}/api/curriculum/${selectedPlan.id}`, {
        ...selectedPlan,
        lessons: updatedLessons
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      await fetchPlans();
      
      // Update selected plan for modal and go back to lessons view
      const updatedPlan = { ...selectedPlan, lessons: updatedLessons };
      setSelectedPlan(updatedPlan);
      setModalView('lessons');
      setEditingLesson(null);
      resetLessonForm();
      
      toaster.create({
        title: 'Success',
        description: `Lesson ${editingLesson ? 'updated' : 'added'} successfully`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving lesson:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to save lesson',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!selectedPlan) return;
    
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      try {
        const token = localStorage.getItem('token');
        const updatedLessons = selectedPlan.lessons.filter(l => l.id !== lessonId);
        
        await axios.put(`${API_BASE_URL}/api/curriculum/${selectedPlan.id}`, {
          ...selectedPlan,
          lessons: updatedLessons
        }, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        await fetchPlans();
        
        // Update selected plan for modal
        const updatedPlan = { ...selectedPlan, lessons: updatedLessons };
        setSelectedPlan(updatedPlan);
        
        toaster.create({
          title: 'Success',
          description: 'Lesson deleted successfully',
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('Error deleting lesson:', error);
        toaster.create({
          title: 'Error',
          description: 'Failed to delete lesson',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  const resetPlanForm = () => {
    setPlanForm({
      title: '',
      teacherId: '',
      classId: '',
      subject: '',
      academicYear: '2024-25'
    });
  };

  const resetLessonForm = () => {
    setLessonForm({
      name: '',
      estimatedPeriods: 1,
      learningOutcomes: [''],
      activities: []
    });
  };

  const addLearningOutcome = () => {
    setLessonForm(prev => ({
      ...prev,
      learningOutcomes: [...prev.learningOutcomes, '']
    }));
  };

  const removeLearningOutcome = (index: number) => {
    setLessonForm(prev => ({
      ...prev,
      learningOutcomes: prev.learningOutcomes.filter((_, i) => i !== index)
    }));
  };

  const updateLearningOutcome = (index: number, value: string) => {
    setLessonForm(prev => ({
      ...prev,
      learningOutcomes: prev.learningOutcomes.map((outcome, i) => i === index ? value : outcome)
    }));
  };

  const addActivity = () => {
    // Reset activity form
    setActivityForm({
      name: '',
      activityType: 'Individual',
      gradingType: 'Marks',
      description: '',
      materials: ['']
    });
    setEditingActivity(null);
    setEditingActivityIndex(null);
    setModalView('editActivity');
  };

  const editActivity = (activity: Activity, index: number) => {
    setActivityForm({
      name: activity.name,
      activityType: activity.activityType,
      gradingType: activity.gradingType,
      description: activity.description,
      materials: [...activity.materials]
    });
    setEditingActivity(activity);
    setEditingActivityIndex(index);
    setModalView('editActivity');
  };

  const removeActivity = (index: number) => {
    setLessonForm(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  };

  const saveActivity = () => {
    if (!activityForm.name.trim()) {
      toaster.create({
        title: 'Validation Error',
        description: 'Activity name is required',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const newActivity: Activity = {
      id: editingActivity?.id || Date.now(),
      name: activityForm.name.trim(),
      activityType: activityForm.activityType,
      gradingType: activityForm.gradingType,
      description: activityForm.description.trim(),
      materials: activityForm.materials.filter(m => m.trim()).map(m => m.trim())
    };

    setLessonForm(prev => {
      if (editingActivityIndex !== null) {
        // Editing existing activity
        return {
          ...prev,
          activities: prev.activities.map((activity, index) => 
            index === editingActivityIndex ? newActivity : activity
          )
        };
      } else {
        // Adding new activity
        return {
          ...prev,
          activities: [...prev.activities, newActivity]
        };
      }
    });

    setModalView('editLesson');
    setEditingActivity(null);
    setEditingActivityIndex(null);
  };

  const addMaterial = () => {
    setActivityForm(prev => ({
      ...prev,
      materials: [...prev.materials, '']
    }));
  };

  const updateMaterial = (index: number, value: string) => {
    setActivityForm(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => i === index ? value : material)
    }));
  };

  const removeMaterial = (index: number) => {
    if (activityForm.materials.length > 1) {
      setActivityForm(prev => ({
        ...prev,
        materials: prev.materials.filter((_, i) => i !== index)
      }));
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'Individual': return 'blue';
      case 'Group': return 'green';
      case 'Homework': return 'orange';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="50vh">
        <Text>Loading lesson plans...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Heading size="lg" color="purple.700">
            📚 Lesson Plan Management
          </Heading>
          <Button
            colorScheme="purple"
            onClick={() => {
              resetPlanForm();
              setShowAddPlanModal(true);
            }}
          >
            <FaPlus />
            Add Lesson Plan
          </Button>
        </HStack>

        {/* Summary Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
          <Card.Root p={4} bg="blue.50" borderColor="blue.200" borderWidth={1}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                {plans.length}
              </Text>
              <Text fontSize="sm" color="blue.600">Lesson Plans</Text>
            </VStack>
          </Card.Root>
          
          <Card.Root p={4} bg="green.50" borderColor="green.200" borderWidth={1}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {plans.reduce((sum, p) => sum + p.lessons.length, 0)}
              </Text>
              <Text fontSize="sm" color="green.600">Total Lessons</Text>
            </VStack>
          </Card.Root>
          
          <Card.Root p={4} bg="orange.50" borderColor="orange.200" borderWidth={1}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                {plans.reduce((sum, p) => sum + p.lessons.reduce((lessonSum, l) => lessonSum + l.activities.length, 0), 0)}
              </Text>
              <Text fontSize="sm" color="orange.600">Total Activities</Text>
            </VStack>
          </Card.Root>
          
          <Card.Root p={4} bg="purple.50" borderColor="purple.200" borderWidth={1}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                {plans.reduce((sum, p) => sum + p.lessons.reduce((lessonSum, l) => lessonSum + l.estimatedPeriods, 0), 0)}
              </Text>
              <Text fontSize="sm" color="purple.600">Total Periods</Text>
            </VStack>
          </Card.Root>
        </SimpleGrid>

        {/* Lesson Plans Grid */}
        <VStack align="stretch" gap={4}>
          {plans.map((plan) => (
            <Card.Root 
              key={plan.id}
              p={6}
              bg="white"
              borderRadius="xl"
              boxShadow="md"
              border="2px solid"
              borderColor="purple.100"
              _hover={{ 
                borderColor: 'purple.300',
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
              transition="all 0.2s"
            >
              <Card.Body>
                <HStack justify="space-between" align="start">
                  <VStack align="start" gap={4} flex="1">
                    <HStack>
                      <Box
                        w={3}
                        h={3}
                        borderRadius="full"
                        bg="green.400"
                      />
                      <Heading size="md" color="purple.800">
                        {plan.title}
                      </Heading>
                      <Badge colorScheme="green" fontSize="xs">
                        Active
                      </Badge>
                    </HStack>

                    <HStack gap={6} fontSize="sm" flexWrap="wrap">
                      <HStack>
                        <Text color="gray.600" fontWeight="medium">Teacher:</Text>
                        <Text color="teal.600" fontWeight="medium">{plan.teacher}</Text>
                      </HStack>
                      
                      <HStack>
                        <Text color="gray.600" fontWeight="medium">Class:</Text>
                        <Badge colorScheme="blue" fontSize="xs">{plan.class}</Badge>
                      </HStack>
                      
                      <HStack>
                        <Text color="gray.600" fontWeight="medium">Subject:</Text>
                        <Text color="orange.600" fontWeight="medium">{plan.subject}</Text>
                      </HStack>

                      <HStack>
                        <Text color="gray.600" fontWeight="medium">Lessons:</Text>
                        <Text color="purple.600" fontWeight="bold">{plan.lessons.length}</Text>
                      </HStack>

                      <HStack>
                        <Text color="gray.600" fontWeight="medium">Activities:</Text>
                        <Text color="blue.600" fontWeight="bold">
                          {plan.lessons.reduce((sum, l) => sum + l.activities.length, 0)}
                        </Text>
                      </HStack>

                      <HStack>
                        <Text color="gray.600" fontWeight="medium">Periods:</Text>
                        <Text color="green.600" fontWeight="bold">
                          {plan.lessons.reduce((sum, l) => sum + l.estimatedPeriods, 0)}
                        </Text>
                      </HStack>
                    </HStack>

                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                        Sample Lessons:
                      </Text>
                      <VStack align="start" gap={1}>
                        {plan.lessons.slice(0, 3).map((lesson, index) => (
                          <Text key={index} fontSize="xs" color="gray.600">
                            • {lesson.name} ({lesson.estimatedPeriods} periods)
                          </Text>
                        ))}
                        {plan.lessons.length > 3 && (
                          <Text fontSize="xs" color="gray.500" fontStyle="italic">
                            +{plan.lessons.length - 3} more lessons...
                          </Text>
                        )}
                      </VStack>
                    </Box>

                    <HStack gap={2} fontSize="xs" color="gray.500">
                      <Text>Created by: {plan.createdBy}</Text>
                      <Text>•</Text>
                      <Text>Academic Year: {plan.academicYear}</Text>
                    </HStack>
                  </VStack>

                  <VStack gap={2}>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => handleViewLessons(plan)}
                    >
                      📖 View Lessons
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <FaTrash />
                    </Button>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>
      </VStack>

      {/* Add Lesson Plan Modal */}
        {showAddPlanModal && (
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
            <Card.Root maxW="2xl" w="95%" maxH="90vh" overflowY="auto">
              <Card.Header>
                <HStack justify="space-between">
                  <Heading size="lg">🆕 Add New Lesson Plan</Heading>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddPlanModal(false)}
                  >
                    <FaTimes />
                  </IconButton>
                </HStack>
              </Card.Header>

              <Card.Body>
                <VStack gap={4} align="stretch">
                  <Box>
                    <Text mb={2} fontWeight="medium">Lesson Plan Title *</Text>
                    <Input
                      value={planForm.title}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Mathematics Foundation Program - Grade 1A"
                    />
                  </Box>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box>
                      <Text mb={2} fontWeight="medium">Teacher *</Text>
                      <select
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '14px'
                        }}
                        value={planForm.teacherId}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, teacherId: e.target.value }))}
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name} ({teacher.subject})
                          </option>
                        ))}
                      </select>
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
                        value={planForm.classId}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, classId: e.target.value }))}
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </Box>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box>
                      <Text mb={2} fontWeight="medium">Subject *</Text>
                      <select
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '14px'
                        }}
                        value={planForm.subject}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, subject: e.target.value }))}
                      >
                        <option value="">Select Subject</option>
                        {SUBJECTS.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                    </Box>

                    <Box>
                      <Text mb={2} fontWeight="medium">Academic Year</Text>
                      <Input
                        value={planForm.academicYear}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, academicYear: e.target.value }))}
                        placeholder="2024-25"
                      />
                    </Box>
                  </SimpleGrid>
                </VStack>
              </Card.Body>

              <Card.Footer>
                <HStack gap={3} w="100%" justify="end">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPlanModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="purple"
                    onClick={handleCreatePlan}
                    loading={submitting}
                    disabled={!planForm.title || !planForm.teacherId || !planForm.classId || !planForm.subject}
                  >
                    Create Plan
                  </Button>
                </HStack>
              </Card.Footer>
            </Card.Root>
          </Box>
        )}

      {/* Main Modal - transitions between lesson list and lesson edit */}
      {modalView !== 'none' && selectedPlan && (
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
            {modalView === 'lessons' && (
              <Card.Root maxW="6xl" w="95%" maxH="90vh" overflowY="auto">
                <Card.Header>
                  <HStack justify="space-between">
                    <Heading size="lg">📖 Lessons - {selectedPlan.title}</Heading>
                    <HStack>
                      <Button
                        size="sm"
                        colorScheme="purple"
                        onClick={handleAddLesson}
                      >
                        <FaPlus />
                        Add Lesson
                      </Button>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        onClick={handleCloseModal}
                      >
                        <FaTimes />
                      </IconButton>
                    </HStack>
                  </HStack>
                </Card.Header>

                <Card.Body>
                  <VStack gap={6} align="stretch">
                    {selectedPlan.lessons.map((lesson, lessonIndex) => (
                      <Card.Root key={lesson.id} p={6} bg="gray.50" borderWidth={2} borderColor="purple.200">
                        <Card.Body>
                          <VStack align="start" gap={4}>
                            <HStack justify="space-between" w="100%">
                              <HStack>
                                <Badge colorScheme="purple" fontSize="sm">Lesson {lessonIndex + 1}</Badge>
                                <Heading size="md" color="purple.700">{lesson.name}</Heading>
                                <Badge variant="outline" colorScheme="purple">{lesson.estimatedPeriods} periods</Badge>
                              </HStack>
                              <HStack>
                                <IconButton
                                  size="sm"
                                  colorScheme="blue"
                                  variant="outline"
                                  onClick={() => handleEditLesson(lesson)}
                                >
                                  <FaEdit />
                                </IconButton>
                                <IconButton
                                  size="sm"
                                  colorScheme="red"
                                  variant="outline"
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                >
                                  <FaTrash />
                                </IconButton>
                              </HStack>
                            </HStack>

                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="blue.600" mb={2}>
                                🎯 Learning Outcomes:
                              </Text>
                              <VStack align="start" gap={1}>
                                {lesson.learningOutcomes.map((outcome, i) => (
                                  <Text key={i} fontSize="sm" color="gray.700">• {outcome}</Text>
                                ))}
                              </VStack>
                            </Box>

                            <Box w="100%">
                              <Text fontSize="sm" fontWeight="bold" color="green.600" mb={3}>
                                🎮 Activities ({lesson.activities.length})
                              </Text>
                              
                              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                {lesson.activities.map((activity) => (
                                  <Card.Root key={activity.id} p={4} bg="white" borderWidth={1} borderColor="green.200">
                                    <Card.Body>
                                      <VStack align="start" gap={3}>
                                        <HStack>
                                          <Heading size="sm" color="green.700">{activity.name}</Heading>
                                          <Badge colorScheme={getActivityTypeColor(activity.activityType)} size="sm">
                                            {activity.activityType}
                                          </Badge>
                                          <Badge variant="outline" size="sm">
                                            {activity.gradingType}
                                          </Badge>
                                        </HStack>

                                        <Text fontSize="sm" color="gray.600">
                                          {activity.description}
                                        </Text>
                                        
                                        <Box>
                                          <Text fontSize="xs" fontWeight="bold" color="teal.600" mb={1}>
                                            🛠️ Materials:
                                          </Text>
                                          <Text fontSize="xs" color="gray.600">
                                            {activity.materials.join(', ')}
                                          </Text>
                                        </Box>
                                      </VStack>
                                    </Card.Body>
                                  </Card.Root>
                                ))}
                              </SimpleGrid>
                            </Box>
                          </VStack>
                        </Card.Body>
                      </Card.Root>
                    ))}
                    {selectedPlan.lessons.length === 0 && (
                      <Text textAlign="center" color="gray.500">
                        No lessons defined for this lesson plan yet.
                      </Text>
                    )}
                  </VStack>
                </Card.Body>

                <Card.Footer>
                  <Button w="100%" onClick={handleCloseModal}>
                    Close
                  </Button>
                </Card.Footer>
              </Card.Root>
            )}

            {modalView === 'editLesson' && (
              <Card.Root maxW="4xl" w="95%" maxH="90vh" overflowY="auto">
                <Card.Header>
                  <HStack justify="space-between">
                    <HStack>
                      <IconButton
                        size="sm"
                        variant="outline"
                        onClick={handleBackToLessons}
                      >
                        <FaArrowLeft />
                      </IconButton>
                      <Heading size="lg">
                        {editingLesson ? '📝 Edit Lesson' : '➕ Add New Lesson'}
                      </Heading>
                    </HStack>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={handleCloseModal}
                    >
                      <FaTimes />
                    </IconButton>
                  </HStack>
                </Card.Header>

              <Card.Body>
                <VStack gap={6} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box>
                      <Text mb={2} fontWeight="medium">Lesson Name *</Text>
                      <Input
                        value={lessonForm.name}
                        onChange={(e) => setLessonForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Counting 1-10"
                      />
                    </Box>

                    <Box>
                      <Text mb={2} fontWeight="medium">Estimated Periods *</Text>
                      <Input
                        type="number"
                        min={1}
                        value={lessonForm.estimatedPeriods}
                        onChange={(e) => setLessonForm(prev => ({ ...prev, estimatedPeriods: parseInt(e.target.value) || 1 }))}
                      />
                    </Box>
                  </SimpleGrid>

                  <Box>
                    <Text mb={2} fontWeight="medium">Learning Outcomes</Text>
                    <VStack gap={2} align="stretch">
                      {lessonForm.learningOutcomes.map((outcome, index) => (
                        <HStack key={index}>
                          <Input
                            value={outcome}
                            onChange={(e) => updateLearningOutcome(index, e.target.value)}
                            placeholder="Enter learning outcome"
                          />
                          {lessonForm.learningOutcomes.length > 1 && (
                            <IconButton
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => removeLearningOutcome(index)}
                            >
                              <FaTrash />
                            </IconButton>
                          )}
                        </HStack>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addLearningOutcome}
                        alignSelf="start"
                      >
                        <FaPlus />
                        Add Learning Outcome
                      </Button>
                    </VStack>
                  </Box>

                  <Box>
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="bold">Activities ({lessonForm.activities.length})</Text>
                      <Button
                        size="sm"
                        colorScheme="green"
                        onClick={addActivity}
                      >
                        <FaPlus />
                        Add Activity
                      </Button>
                    </HStack>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                      {lessonForm.activities.map((activity, index) => (
                        <Card.Root 
                          key={activity.id} 
                          p={4} 
                          bg="gray.50" 
                          borderWidth={1}
                          cursor="pointer"
                          _hover={{ bg: "gray.100", transform: "translateY(-1px)" }}
                          transition="all 0.2s"
                          onClick={() => editActivity(activity, index)}
                        >
                          <Card.Body>
                            <VStack align="start" gap={2}>
                              <HStack justify="space-between" w="100%">
                                <Text fontWeight="bold" fontSize="sm">{activity.name}</Text>
                                <HStack gap={1}>
                                  <IconButton
                                    size="xs"
                                    colorScheme="blue"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editActivity(activity, index);
                                    }}
                                  >
                                    <FaEdit />
                                  </IconButton>
                                  <IconButton
                                    size="xs"
                                    colorScheme="red"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeActivity(index);
                                    }}
                                  >
                                    <FaTrash />
                                  </IconButton>
                                </HStack>
                              </HStack>
                              <HStack>
                                <Badge colorScheme={getActivityTypeColor(activity.activityType)} size="sm">
                                  {activity.activityType}
                                </Badge>
                                <Badge variant="outline" size="sm">
                                  {activity.gradingType}
                                </Badge>
                              </HStack>
                              <Text fontSize="xs" color="gray.600">{activity.description}</Text>
                              <Text fontSize="xs" color="teal.600">
                                Materials: {activity.materials.join(', ')}
                              </Text>
                            </VStack>
                          </Card.Body>
                        </Card.Root>
                      ))}
                    </SimpleGrid>
                  </Box>
                </VStack>
              </Card.Body>

              <Card.Footer>
                <HStack gap={3} w="100%" justify="end">
                  <Button
                    variant="outline"
                    onClick={handleBackToLessons}
                  >
                    Back
                  </Button>
                  <Button
                    colorScheme="purple"
                    onClick={handleSaveLesson}
                    loading={submitting}
                    disabled={!lessonForm.name}
                  >
                    <FaSave />
                    {editingLesson ? 'Update Lesson' : 'Add Lesson'}
                  </Button>
                </HStack>
              </Card.Footer>
              </Card.Root>
            )}

            {modalView === 'editActivity' && (
              <Card.Root maxW="2xl" w="95%" maxH="90vh" overflowY="auto">
                <Card.Header>
                  <HStack justify="space-between">
                    <HStack>
                      <IconButton
                        size="sm"
                        variant="outline"
                        onClick={() => setModalView('editLesson')}
                      >
                        <FaArrowLeft />
                      </IconButton>
                      <Heading size="lg">
                        {editingActivity ? '✏️ Edit Activity' : '➕ Add New Activity'}
                      </Heading>
                    </HStack>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setModalView('editLesson')}
                    >
                      <FaTimes />
                    </IconButton>
                  </HStack>
                </Card.Header>

                <Card.Body>
                  <VStack gap={6} align="stretch">
                    <Box>
                      <Text mb={2} fontWeight="medium">Activity Name *</Text>
                      <Input
                        value={activityForm.name}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Counting Bears Activity"
                      />
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                      <Box>
                        <Text mb={2} fontWeight="medium">Activity Type *</Text>
                        <HStack gap={2}>
                          {(['Individual', 'Group', 'Homework'] as const).map((type) => (
                            <Button
                              key={type}
                              size="sm"
                              variant="outline"
                              colorScheme="blue"
                              bg={activityForm.activityType === type ? 'blue.500' : 'transparent'}
                              color={activityForm.activityType === type ? 'white' : 'blue.500'}
                              onClick={() => setActivityForm(prev => ({ ...prev, activityType: type }))}
                            >
                              {type}
                            </Button>
                          ))}
                        </HStack>
                      </Box>

                      <Box>
                        <Text mb={2} fontWeight="medium">Grading Type *</Text>
                        <HStack gap={2}>
                          {(['Marks', 'Rubric'] as const).map((type) => (
                            <Button
                              key={type}
                              size="sm"
                              variant="outline"
                              colorScheme="green"
                              bg={activityForm.gradingType === type ? 'green.500' : 'transparent'}
                              color={activityForm.gradingType === type ? 'white' : 'green.500'}
                              onClick={() => setActivityForm(prev => ({ ...prev, gradingType: type }))}
                            >
                              {type}
                            </Button>
                          ))}
                        </HStack>
                      </Box>
                    </SimpleGrid>

                    <Box>
                      <Text mb={2} fontWeight="medium">Description</Text>
                      <Textarea
                        value={activityForm.description}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the activity and its objectives..."
                        rows={4}
                      />
                    </Box>

                    <Box>
                      <Text mb={2} fontWeight="medium">Materials Needed</Text>
                      <VStack gap={2} align="stretch">
                        {activityForm.materials.map((material, index) => (
                          <HStack key={index}>
                            <Input
                              value={material}
                              onChange={(e) => updateMaterial(index, e.target.value)}
                              placeholder="Enter material needed"
                            />
                            {activityForm.materials.length > 1 && (
                              <IconButton
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => removeMaterial(index)}
                              >
                                <FaTrash />
                              </IconButton>
                            )}
                          </HStack>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addMaterial}
                          alignSelf="start"
                        >
                          <FaPlus />
                          Add Material
                        </Button>
                      </VStack>
                    </Box>
                  </VStack>
                </Card.Body>

                <Card.Footer>
                  <HStack gap={3} w="100%" justify="end">
                    <Button
                      variant="outline"
                      onClick={() => setModalView('editLesson')}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorScheme="green"
                      onClick={saveActivity}
                      disabled={!activityForm.name.trim()}
                    >
                      <FaSave />
                      {editingActivity ? 'Update Activity' : 'Add Activity'}
                    </Button>
                  </HStack>
                </Card.Footer>
              </Card.Root>
            )}
          </Box>
        )}
    </Box>
  );
};

export default LessonPlanManagement;