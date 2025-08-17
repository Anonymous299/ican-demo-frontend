import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  HStack,
  VStack,
  Text,
  Input,
  Badge,
  Heading,
} from '@chakra-ui/react';
import { API_BASE_URL } from '../config/constants';

interface Class {
  id: number;
  name: string;
  grade: string;
  division: string;
  description: string;
  teacherId?: number;
  classTeacher?: string;
  capacity: number;
  currentEnrollment: number;
  subjects: string[];
  schedule: string;
  academicYear: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ClassStats {
  classId: number;
  className: string;
  totalCapacity: number;
  currentEnrollment: number;
  availableSpots: number;
  enrollmentPercentage: number;
  subjects: number;
  hasClassTeacher: boolean;
  academicYear: string;
  status: string;
}

interface Teacher {
  id: number;
  name: string;
  email: string;
  subject: string;
  phone: string;
}

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClassStats, setSelectedClassStats] = useState<ClassStats | null>(null);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  
  const [formData, setFormData] = useState<{
    grade: string;
    division: string;
    description: string;
    teacherId: string;
    classTeacher: string;
    capacity: number;
    subjects: string[] | string;
    schedule: string;
    academicYear: string;
    status: string;
  }>({
    grade: '',
    division: '',
    description: '',
    teacherId: '',
    classTeacher: '',
    capacity: 20,
    subjects: ['Mathematics', 'English', 'Science', 'Social Studies'],
    schedule: 'Morning',
    academicYear: '2024-25',
    status: 'active'
  });

  const [bulkCreateData, setBulkCreateData] = useState({
    grade: '',
    academicYear: '2024-25'
  });

  const GRADES = ['BV-1', 'BV-2', 'BV-3', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const DIVISIONS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const SCHEDULES = ['Morning', 'Afternoon', 'Evening'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch both classes and teachers
      const [classesResponse, teachersResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/classes`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/teachers`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setClasses(classesResponse.data);
      setTeachers(teachersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      grade: '',
      division: '',
      description: '',
      teacherId: '',
      classTeacher: '',
      capacity: 20,
      subjects: ['Mathematics', 'English', 'Science', 'Social Studies'],
      schedule: 'Morning',
      academicYear: '2024-25',
      status: 'active'
    });
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      grade: classItem.grade,
      division: classItem.division,
      description: classItem.description,
      teacherId: classItem.teacherId?.toString() || '',
      classTeacher: classItem.classTeacher || '',
      capacity: classItem.capacity,
      subjects: classItem.subjects,
      schedule: classItem.schedule,
      academicYear: classItem.academicYear,
      status: classItem.status
    });
    setShowAddForm(true);
  };

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const payload = {
        ...formData,
        teacherId: formData.teacherId ? parseInt(formData.teacherId) : null,
        subjects: typeof formData.subjects === 'string' 
          ? (formData.subjects as string).split(',').map((s: string) => s.trim())
          : formData.subjects
      };

      if (editingClass) {
        await axios.put(`${API_BASE_URL}/api/classes/${editingClass.id}`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/classes`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      await fetchClasses();
      resetForm();
      setShowAddForm(false);
      setEditingClass(null);
      
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Error saving class. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (classId: number) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchClasses();
      } catch (error: any) {
        console.error('Error deleting class:', error);
        const message = error.response?.data?.error || 'Error deleting class';
        alert(message);
      }
    }
  };

  const handleViewStats = async (classItem: Class) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/classes/${classItem.id}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedClassStats(response.data);
    } catch (error) {
      console.error('Error fetching class stats:', error);
    }
  };

  const handleBulkCreate = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE_URL}/api/classes/bulk`, {
        operation: 'create_standard_classes',
        classes: bulkCreateData
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert(`Bulk creation completed!\nCreated: ${response.data.created} classes\nErrors: ${response.data.errors.length}`);
      await fetchClasses();
      setShowBulkCreate(false);
      setBulkCreateData({ grade: '', academicYear: '2024-25' });
      
    } catch (error) {
      console.error('Error with bulk creation:', error);
      alert('Error with bulk creation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getEnrollmentColor = (percentage: number) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'orange';
    if (percentage >= 50) return 'yellow';
    return 'green';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="50vh">
        <Text>Loading classes...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Heading size="lg" color="purple.700">
            🏫 Class Management
          </Heading>
          <HStack gap={3}>
            <Button
              colorScheme="blue"
              variant="outline"
              onClick={() => setShowBulkCreate(true)}
            >
              ⚡ Bulk Create
            </Button>
            <Button
              colorScheme="purple"
              onClick={() => {
                resetForm();
                setEditingClass(null);
                setShowAddForm(true);
              }}
            >
              + Add Class
            </Button>
          </HStack>
        </HStack>

        {/* Summary Stats */}
        <Box>
          <HStack gap={4} wrap="wrap">
            <Card.Root p={4} bg="blue.50" borderColor="blue.200" borderWidth={1}>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {classes.length}
                </Text>
                <Text fontSize="sm" color="blue.600">Total Classes</Text>
              </VStack>
            </Card.Root>
            
            <Card.Root p={4} bg="green.50" borderColor="green.200" borderWidth={1}>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {classes.reduce((sum, c) => sum + c.currentEnrollment, 0)}
                </Text>
                <Text fontSize="sm" color="green.600">Total Students</Text>
              </VStack>
            </Card.Root>
            
            <Card.Root p={4} bg="orange.50" borderColor="orange.200" borderWidth={1}>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                  {classes.reduce((sum, c) => sum + c.capacity, 0)}
                </Text>
                <Text fontSize="sm" color="orange.600">Total Capacity</Text>
              </VStack>
            </Card.Root>
            
            <Card.Root p={4} bg="purple.50" borderColor="purple.200" borderWidth={1}>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                  {classes.filter(c => c.classTeacher).length}
                </Text>
                <Text fontSize="sm" color="purple.600">Assigned Teachers</Text>
              </VStack>
            </Card.Root>
          </HStack>
        </Box>

        {/* Classes Grid */}
        <VStack align="stretch" gap={4}>
          {classes.map((classItem) => (
            <Card.Root 
              key={classItem.id}
              p={4}
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
                  <VStack align="start" gap={3} flex="1">
                    <HStack>
                      <Box
                        w={3}
                        h={3}
                        borderRadius="full"
                        bg={classItem.status === 'active' ? 'green.400' : 'gray.400'}
                      />
                      <Heading size="md" color="purple.800">
                        {classItem.name}
                      </Heading>
                      <Badge colorScheme="purple" fontSize="xs">
                        {classItem.academicYear}
                      </Badge>
                    </HStack>

                    <HStack gap={6} fontSize="sm">
                      <HStack>
                        <Text color="gray.600" fontWeight="medium">Capacity:</Text>
                        <Text color="blue.600" fontWeight="bold">
                          {classItem.currentEnrollment}/{classItem.capacity}
                        </Text>
                        <Badge 
                          colorScheme={getEnrollmentColor(
                            Math.round((classItem.currentEnrollment / classItem.capacity) * 100)
                          )}
                          fontSize="xs"
                        >
                          {Math.round((classItem.currentEnrollment / classItem.capacity) * 100)}%
                        </Badge>
                      </HStack>
                      
                      <HStack>
                        <Text color="gray.600" fontWeight="medium">Schedule:</Text>
                        <Text color="orange.600" fontWeight="medium">{classItem.schedule}</Text>
                      </HStack>
                      
                      <HStack>
                        <Text color="gray.600" fontWeight="medium">Teacher:</Text>
                        <Text color="teal.600" fontWeight="medium">
                          {classItem.teacherId 
                            ? teachers.find(t => t.id === classItem.teacherId)?.name || classItem.classTeacher
                            : 'Not Assigned'}
                        </Text>
                      </HStack>
                    </HStack>

                    <Text color="gray.600" fontSize="sm">
                      {classItem.description}
                    </Text>

                    <HStack gap={2} flexWrap="wrap">
                      {classItem.subjects.map((subject, index) => (
                        <Badge key={index} variant="outline" colorScheme="blue" fontSize="xs">
                          {subject}
                        </Badge>
                      ))}
                    </HStack>
                  </VStack>

                  <VStack gap={2}>
                    <Button
                      size="sm"
                      colorScheme="teal"
                      variant="outline"
                      onClick={() => handleViewStats(classItem)}
                    >
                      📊 Stats
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="purple"
                      onClick={() => handleEditClass(classItem)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleDeleteClass(classItem.id)}
                    >
                      Delete
                    </Button>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>

        {/* Add/Edit Class Form Modal */}
        {showAddForm && (
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
            <Card.Root maxW="2xl" w="90%" maxH="90vh" overflowY="auto">
              <Card.Header>
                <HStack justify="space-between">
                  <Heading size="lg">
                    {editingClass ? 'Edit Class' : 'Add New Class'}
                  </Heading>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingClass(null);
                      resetForm();
                    }}
                  >
                    ✕
                  </Button>
                </HStack>
              </Card.Header>

              <form onSubmit={handleSubmitClass}>
                <Card.Body>
                  <VStack gap={4} align="stretch">
                    {/* Basic Information */}
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" mb={3} color="purple.600">
                        📝 Basic Information
                      </Text>
                      
                      <HStack gap={4} mb={4}>
                        <Box flex="1">
                          <Text mb={2} fontWeight="medium">Grade *</Text>
                          <select
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              backgroundColor: 'white',
                              fontSize: '14px'
                            }}
                            value={formData.grade}
                            onChange={(e) => handleInputChange('grade', e.target.value)}
                            required
                          >
                            <option value="">Select Grade</option>
                            {GRADES.map((grade) => (
                              <option key={grade} value={grade}>
                                {grade}
                              </option>
                            ))}
                          </select>
                        </Box>

                        <Box flex="1">
                          <Text mb={2} fontWeight="medium">Division *</Text>
                          <select
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              backgroundColor: 'white',
                              fontSize: '14px'
                            }}
                            value={formData.division}
                            onChange={(e) => handleInputChange('division', e.target.value)}
                            required
                          >
                            <option value="">Select Division</option>
                            {DIVISIONS.map((division) => (
                              <option key={division} value={division}>
                                {division}
                              </option>
                            ))}
                          </select>
                        </Box>
                      </HStack>

                      <Box mb={4}>
                        <Text mb={2} fontWeight="medium">Description</Text>
                        <Input
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Brief description of the class"
                        />
                      </Box>

                      <HStack gap={4}>
                        <Box flex="1">
                          <Text mb={2} fontWeight="medium">Capacity</Text>
                          <Input
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 20)}
                            min="1"
                            max="50"
                          />
                        </Box>

                        <Box flex="1">
                          <Text mb={2} fontWeight="medium">Schedule</Text>
                          <select
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              backgroundColor: 'white',
                              fontSize: '14px'
                            }}
                            value={formData.schedule}
                            onChange={(e) => handleInputChange('schedule', e.target.value)}
                          >
                            {SCHEDULES.map((schedule) => (
                              <option key={schedule} value={schedule}>
                                {schedule}
                              </option>
                            ))}
                          </select>
                        </Box>
                      </HStack>
                    </Box>

                    {/* Teacher Assignment */}
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" mb={3} color="teal.600">
                        👩‍🏫 Teacher Assignment
                      </Text>
                      
                      <Box>
                        <Text mb={2} fontWeight="medium">Class Teacher</Text>
                        <select
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            fontSize: '14px'
                          }}
                          value={formData.teacherId}
                          onChange={(e) => {
                            const teacherId = e.target.value;
                            const selectedTeacher = teachers.find(t => t.id.toString() === teacherId);
                            handleInputChange('teacherId', teacherId);
                            handleInputChange('classTeacher', selectedTeacher?.email || '');
                          }}
                        >
                          <option value="">Select Teacher (Optional)</option>
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id.toString()}>
                              {teacher.name} - {teacher.subject}
                            </option>
                          ))}
                        </select>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Optional: Assign a class teacher to this class
                        </Text>
                      </Box>
                    </Box>

                    {/* Subjects */}
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" mb={3} color="blue.600">
                        📚 Subjects
                      </Text>
                      
                      <Box>
                        <Text mb={2} fontWeight="medium">Subjects</Text>
                        <Input
                          value={Array.isArray(formData.subjects) ? formData.subjects.join(', ') : formData.subjects}
                          onChange={(e) => handleInputChange('subjects', e.target.value.split(',').map(s => s.trim()))}
                          placeholder="Mathematics, English, Science, Social Studies"
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Separate subjects with commas
                        </Text>
                      </Box>
                    </Box>

                    {/* Academic Year & Status */}
                    <HStack gap={4}>
                      <Box flex="1">
                        <Text mb={2} fontWeight="medium">Academic Year</Text>
                        <Input
                          value={formData.academicYear}
                          onChange={(e) => handleInputChange('academicYear', e.target.value)}
                          placeholder="2024-25"
                        />
                      </Box>

                      <Box flex="1">
                        <Text mb={2} fontWeight="medium">Status</Text>
                        <select
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            fontSize: '14px'
                          }}
                          value={formData.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </Box>
                    </HStack>
                  </VStack>
                </Card.Body>

                <Card.Footer>
                  <HStack gap={3} w="100%" justify="end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingClass(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      colorScheme="purple"
                      loading={submitting}
                    >
                      {editingClass ? 'Update Class' : 'Create Class'}
                    </Button>
                  </HStack>
                </Card.Footer>
              </form>
            </Card.Root>
          </Box>
        )}

        {/* Bulk Create Modal */}
        {showBulkCreate && (
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
                <HStack justify="space-between">
                  <Heading size="md">⚡ Bulk Create Classes</Heading>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowBulkCreate(false)}
                  >
                    ✕
                  </Button>
                </HStack>
              </Card.Header>

              <Card.Body>
                <VStack gap={4} align="stretch">
                  <Box
                    p={3}
                    bg="blue.50"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="blue.200"
                  >
                    <Text fontSize="sm" color="blue.700">
                      This will create classes for all divisions (A through F) for the selected grade.
                    </Text>
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="medium">Grade *</Text>
                    <select
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        fontSize: '14px'
                      }}
                      value={bulkCreateData.grade}
                      onChange={(e) => setBulkCreateData(prev => ({ ...prev, grade: e.target.value }))}
                      required
                    >
                      <option value="">Select Grade</option>
                      {GRADES.map((grade) => (
                        <option key={grade} value={grade}>
                          Grade {grade}
                        </option>
                      ))}
                    </select>
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="medium">Academic Year</Text>
                    <Input
                      value={bulkCreateData.academicYear}
                      onChange={(e) => setBulkCreateData(prev => ({ ...prev, academicYear: e.target.value }))}
                      placeholder="2024-25"
                    />
                  </Box>
                </VStack>
              </Card.Body>

              <Card.Footer>
                <HStack gap={3} w="100%" justify="end">
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkCreate(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="blue"
                    loading={submitting}
                    onClick={handleBulkCreate}
                    disabled={!bulkCreateData.grade}
                  >
                    Create 6 Classes (A-F)
                  </Button>
                </HStack>
              </Card.Footer>
            </Card.Root>
          </Box>
        )}

        {/* Class Stats Modal */}
        {selectedClassStats && (
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
            <Card.Root maxW="lg" w="90%">
              <Card.Header>
                <HStack justify="space-between">
                  <Heading size="md">📊 Class Statistics</Heading>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedClassStats(null)}
                  >
                    ✕
                  </Button>
                </HStack>
              </Card.Header>

              <Card.Body>
                <VStack gap={4} align="stretch">
                  <Box textAlign="center">
                    <Heading size="lg" color="purple.600">
                      {selectedClassStats.className}
                    </Heading>
                    <Text color="gray.600">{selectedClassStats.academicYear}</Text>
                  </Box>

                  <HStack gap={4} justify="center">
                    <Card.Root p={4} bg="blue.50" borderColor="blue.200" borderWidth={1}>
                      <VStack>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                          {selectedClassStats.currentEnrollment}
                        </Text>
                        <Text fontSize="sm" color="blue.600">Students</Text>
                      </VStack>
                    </Card.Root>
                    
                    <Card.Root p={4} bg="green.50" borderColor="green.200" borderWidth={1}>
                      <VStack>
                        <Text fontSize="2xl" fontWeight="bold" color="green.600">
                          {selectedClassStats.availableSpots}
                        </Text>
                        <Text fontSize="sm" color="green.600">Available</Text>
                      </VStack>
                    </Card.Root>
                    
                    <Card.Root p={4} bg="orange.50" borderColor="orange.200" borderWidth={1}>
                      <VStack>
                        <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                          {selectedClassStats.enrollmentPercentage}%
                        </Text>
                        <Text fontSize="sm" color="orange.600">Capacity</Text>
                      </VStack>
                    </Card.Root>
                  </HStack>

                  <VStack align="stretch" gap={2}>
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Total Capacity:</Text>
                      <Text>{selectedClassStats.totalCapacity} students</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Subjects:</Text>
                      <Text>{selectedClassStats.subjects} subjects</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Class Teacher:</Text>
                      <Badge colorScheme={selectedClassStats.hasClassTeacher ? 'green' : 'red'}>
                        {selectedClassStats.hasClassTeacher ? 'Assigned' : 'Not Assigned'}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Status:</Text>
                      <Badge colorScheme={selectedClassStats.status === 'active' ? 'green' : 'gray'}>
                        {selectedClassStats.status}
                      </Badge>
                    </HStack>
                  </VStack>
                </VStack>
              </Card.Body>

              <Card.Footer>
                <Button
                  w="100%"
                  onClick={() => setSelectedClassStats(null)}
                >
                  Close
                </Button>
              </Card.Footer>
            </Card.Root>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default ClassManagement;