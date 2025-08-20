import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Table,
  Input,
  VStack,
  HStack,
  Text,
  Badge,
  Textarea,
  Flex,
  Spacer,
  Card,
} from '@chakra-ui/react';
import { FaPlus, FaUpload, FaEdit, FaTrash, FaTimes, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const AVAILABLE_SUBJECTS = ['Math', 'English', 'Hindi', 'Science', 'Geography'];
const STANDARDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const DIVISIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Generate all possible class combinations
const generateClassOptions = () => {
  const classes = [];
  for (const standard of STANDARDS) {
    for (const division of DIVISIONS) {
      classes.push(`Grade ${standard}${division}`);
    }
  }
  return classes;
};

const AVAILABLE_CLASSES = generateClassOptions();

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  classes: string[];
  classSubjects?: { [className: string]: string[] }; // Optional for backward compatibility
  isClassTeacher: boolean;
  classTeacherFor: string | null;
  createdAt: string;
}

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    classSubjects: {} as { [className: string]: string[] }, // Maps class -> subjects
    classes: [] as string[],
    isClassTeacher: false,
    classTeacherFor: '',
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/teachers`);
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    try {
      // Convert classSubjects to flat subjects array for backend compatibility
      const allSubjects = Array.from(new Set(
        Object.values(formData.classSubjects).flat()
      ));
      
      const teacherData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subjects: allSubjects,
        classes: formData.classes,
        classSubjects: formData.classSubjects, // Keep the detailed mapping for frontend
        isClassTeacher: formData.isClassTeacher,
        classTeacherFor: formData.classTeacherFor,
      };

      if (editingTeacher) {
        await axios.put(`${API_BASE_URL}/api/teachers/${editingTeacher.id}`, teacherData);
      } else {
        await axios.post(`${API_BASE_URL}/api/teachers`, teacherData);
      }

      fetchTeachers();
      resetForm();
    } catch (error) {
      console.error('Error saving teacher:', error);
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/teachers/${id}`);
        fetchTeachers();
      } catch (error) {
        console.error('Error deleting teacher:', error);
      }
    }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    
    // If teacher has classSubjects data, use it; otherwise create empty mapping
    const classSubjects = (teacher as any).classSubjects || {};
    
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      classSubjects: classSubjects,
      classes: teacher.classes,
      isClassTeacher: teacher.isClassTeacher,
      classTeacherFor: teacher.classTeacherFor || '',
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      classSubjects: {},
      classes: [],
      isClassTeacher: false,
      classTeacherFor: '',
    });
    setEditingTeacher(null);
    setShowAddForm(false);
    setShowUploadForm(false);
  };


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/teachers/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchTeachers();
      setShowUploadForm(false);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box 
        p={6} 
        bg="white" 
        borderRadius="xl" 
        boxShadow="md"
        borderLeft="4px solid"
        borderLeftColor="teal.400"
        mb={6}
      >
        <Flex align="center">
          <Heading 
            size="lg" 
            bgGradient="linear(to-r, teal.600, cyan.500)"
            bgClip="text"
          >
            👩‍🏫 Teacher Management
          </Heading>
          <Spacer />
        <HStack gap={3}>
          <Button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            backgroundImage="linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)"
            color="white"
            _hover={{ 
              backgroundImage: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
              transform: 'translateY(-2px)',
              boxShadow: 'lg'
            }}
            transition="all 0.2s"
          >
            <FaPlus /> Add Teacher
          </Button>
          <Button
            bg="emerald.400"
            color="white"
            _hover={{ 
              bg: 'emerald.500',
              transform: 'translateY(-2px)',
              boxShadow: 'lg'
            }}
            transition="all 0.2s"
            onClick={() => setShowUploadForm(true)}
          >
            <FaUpload /> Upload Excel
          </Button>
        </HStack>
        </Flex>
      </Box>

      {/* Add/Edit Teacher Form */}
      {showAddForm && (
        <Card.Root mb={6}>
          <Card.Header>
            <Flex align="center">
              <Heading size="md">
                {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
              </Heading>
              <Spacer />
              <Button
                size="sm"
                variant="ghost"
                onClick={resetForm}
              >
                <FaTimes />
              </Button>
            </Flex>
          </Card.Header>
          <Card.Body>
            <VStack gap={4}>
              <HStack w="100%" gap={4}>
                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">Name</Text>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Teacher's full name"
                  />
                </Box>
                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">Email</Text>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </Box>
              </HStack>

              <Box w="100%">
                <Text mb={2} fontWeight="medium">Phone</Text>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </Box>

              <Box w="100%">
                <Text mb={2} fontWeight="medium">Classes & Subjects</Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  First add classes, then assign subjects for each class
                </Text>
                
                {/* Class selection */}
                <VStack align="start" gap={3}>
                  <select
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      fontSize: '14px'
                    }}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const selectedClass = e.target.value;
                      if (selectedClass && !formData.classes.includes(selectedClass)) {
                        setFormData({ 
                          ...formData, 
                          classes: [...formData.classes, selectedClass],
                          classSubjects: {
                            ...formData.classSubjects,
                            [selectedClass]: [] // Initialize empty subjects for new class
                          }
                        });
                      }
                      e.target.value = ''; // Reset dropdown
                    }}
                  >
                    <option value="">Select a class to add</option>
                    {AVAILABLE_CLASSES.filter(className => !formData.classes.includes(className)).map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                  
                  {/* Display classes with their subjects */}
                  {formData.classes.map((className) => (
                    <Box key={className} w="100%" p={3} border="1px solid #e2e8f0" borderRadius="md" bg="gray.50">
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium" color="green.600">{className}</Text>
                        <Button
                          size="xs"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => {
                            const updatedClasses = formData.classes.filter(c => c !== className);
                            const updatedClassSubjects = { ...formData.classSubjects };
                            delete updatedClassSubjects[className];
                            setFormData({ 
                              ...formData, 
                              classes: updatedClasses,
                              classSubjects: updatedClassSubjects,
                              // Clear classTeacherFor if the removed class was selected
                              classTeacherFor: formData.classTeacherFor === className ? '' : formData.classTeacherFor
                            });
                          }}
                        >
                          Remove Class
                        </Button>
                      </HStack>
                      
                      {/* Subject selection for this class */}
                      <VStack align="start" gap={2}>
                        <select
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid #cbd5e0',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            fontSize: '13px'
                          }}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const selectedSubject = e.target.value;
                            const currentSubjects = formData.classSubjects[className] || [];
                            if (selectedSubject && !currentSubjects.includes(selectedSubject)) {
                              setFormData({
                                ...formData,
                                classSubjects: {
                                  ...formData.classSubjects,
                                  [className]: [...currentSubjects, selectedSubject]
                                }
                              });
                            }
                            e.target.value = ''; // Reset dropdown
                          }}
                        >
                          <option value="">Add subject for {className}</option>
                          {AVAILABLE_SUBJECTS.filter(subject => 
                            !(formData.classSubjects[className] || []).includes(subject)
                          ).map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </select>
                        
                        {/* Display subjects for this class */}
                        {(formData.classSubjects[className] || []).length > 0 && (
                          <HStack flexWrap="wrap" gap={1}>
                            {(formData.classSubjects[className] || []).map((subject) => (
                              <Badge
                                key={subject}
                                colorScheme="blue"
                                variant="solid"
                                px={2}
                                py={1}
                                cursor="pointer"
                                fontSize="xs"
                                onClick={() => {
                                  const updatedSubjects = (formData.classSubjects[className] || []).filter(s => s !== subject);
                                  setFormData({
                                    ...formData,
                                    classSubjects: {
                                      ...formData.classSubjects,
                                      [className]: updatedSubjects
                                    }
                                  });
                                }}
                              >
                                {subject} ×
                              </Badge>
                            ))}
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  ))}
                  
                  {formData.classes.length === 0 && (
                    <Text fontSize="sm" color="gray.500" fontStyle="italic">
                      No classes added yet. Select classes from the dropdown above.
                    </Text>
                  )}
                </VStack>
              </Box>

              {formData.isClassTeacher && (
                <Box w="100%">
                  <Text mb={2} fontWeight="medium">Class Teacher For</Text>
                  <select
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      fontSize: '14px'
                    }}
                    value={formData.classTeacherFor}
                    onChange={(e) => setFormData({ ...formData, classTeacherFor: e.target.value })}
                  >
                    <option value="">Select class to be teacher for</option>
                    {formData.classes.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                  {formData.classes.length === 0 && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Please assign classes first to select which one to be class teacher for
                    </Text>
                  )}
                </Box>
              )}

              <Box w="100%">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isClassTeacher}
                    onChange={(e) => setFormData({ ...formData, isClassTeacher: e.target.checked })}
                  />
                  <Text>Is Class Teacher</Text>
                </label>
              </Box>

              <HStack w="100%" justify="flex-end" gap={3} pt={4}>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleAddTeacher}
                  loading={loading}
                >
                  {editingTeacher ? 'Update' : 'Add'} Teacher
                </Button>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <Card.Root mb={6}>
          <Card.Header>
            <Flex align="center">
              <Heading size="md">Upload Teachers from Excel</Heading>
              <Spacer />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowUploadForm(false)}
              >
                <FaTimes />
              </Button>
            </Flex>
          </Card.Header>
          <Card.Body>
            <VStack gap={4}>
              <Text color="gray.600" fontSize="sm">
                Upload an Excel file with columns: Name, Email, Phone, Classes, ClassSubjects (or Subjects), IsClassTeacher, ClassTeacherFor
              </Text>
              
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Column formats:</Text>
                <VStack align="start" gap={1} fontSize="xs" color="gray.600">
                  <Text>• <strong>Classes:</strong> Comma-separated (e.g., "Grade 1A, Grade 2B")</Text>
                  <Text>• <strong>ClassSubjects:</strong> Class-subject mapping (e.g., "Grade 1A:Math,Science;Grade 2B:English,Hindi")</Text>
                  <Text>• <strong>Subjects (legacy):</strong> If ClassSubjects not provided, comma-separated subjects applied to all classes</Text>
                  <Text>• <strong>IsClassTeacher:</strong> true or false</Text>
                </VStack>
              </Box>
              
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                p={1}
              />
              
              <Text fontSize="xs" color="gray.500">
                Use ClassSubjects column to specify which subjects are taught in which classes. This ensures proper class-subject mapping.
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      <HStack 
        mb={4}
        maxW="400px"
        bg="white"
        p={2}
        borderRadius="full"
        boxShadow="md"
        border="2px solid"
        borderColor="teal.200"
      >
        <Box color="teal.500" pl={2}>
          <FaSearch />
        </Box>
        <Input
          placeholder="Search teachers by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outline"
          border="none"
          px={2}
        />
      </HStack>

      <Box bg="white" borderRadius="xl" shadow="lg" overflow="hidden" border="2px solid" borderColor="teal.100">
        <Table.Root>
          <Table.Header bgGradient="linear(to-r, teal.50, cyan.50)">
            <Table.Row>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader>Email</Table.ColumnHeader>
              <Table.ColumnHeader>Phone</Table.ColumnHeader>
              <Table.ColumnHeader>Classes & Subjects</Table.ColumnHeader>
              <Table.ColumnHeader>Class Teacher</Table.ColumnHeader>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredTeachers.map((teacher) => (
              <Table.Row key={teacher.id}>
                <Table.Cell fontWeight="medium">{teacher.name}</Table.Cell>
                <Table.Cell>{teacher.email}</Table.Cell>
                <Table.Cell>{teacher.phone}</Table.Cell>
                <Table.Cell>
                  <VStack align="start" gap={2}>
                    {teacher.classes && teacher.classes.map((className) => (
                      <Box key={className}>
                        <Badge colorScheme="teal" size="sm" mb={1} variant="solid">
                          {className}
                        </Badge>
                        {teacher.classSubjects && teacher.classSubjects[className] && (
                          <HStack flexWrap="wrap" gap={1} mt={1}>
                            {teacher.classSubjects[className].map((subject) => (
                              <Badge key={subject} colorScheme="purple" size="xs" variant="subtle">
                                {subject}
                              </Badge>
                            ))}
                          </HStack>
                        )}
                        {/* Fallback: show all subjects if classSubjects not available */}
                        {(!teacher.classSubjects || !teacher.classSubjects[className]) && (
                          <HStack flexWrap="wrap" gap={1} mt={1}>
                            {teacher.subjects && teacher.subjects.map((subject) => (
                              <Badge key={subject} colorScheme="purple" size="xs" variant="subtle">
                                {subject}
                              </Badge>
                            ))}
                          </HStack>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Table.Cell>
                <Table.Cell>
                  {teacher.isClassTeacher && (
                    <Badge colorScheme="purple">
                      {teacher.classTeacherFor || 'Class Teacher'}
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <HStack gap={2}>
                    <Button
                      size="sm"
                      colorScheme="yellow"
                      variant="outline"
                      onClick={() => handleEditTeacher(teacher)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleDeleteTeacher(teacher.id)}
                    >
                      <FaTrash />
                    </Button>
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        {filteredTeachers.length === 0 && (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">No teachers found</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TeacherManagement;