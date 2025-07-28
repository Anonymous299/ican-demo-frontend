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
import { FaPlus, FaUpload, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const AVAILABLE_SUBJECTS = ['Math', 'English', 'Hindi', 'Science', 'Geography'];

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  classes: string[];
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
    subjects: [] as string[],
    classes: '',
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
      const teacherData = {
        ...formData,
        subjects: formData.subjects,
        classes: formData.classes.split(',').map(c => c.trim()).filter(c => c),
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
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      subjects: teacher.subjects,
      classes: teacher.classes.join(', '),
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
      subjects: [],
      classes: '',
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
      <Flex align="center" mb={6}>
        <Heading size="lg" color="blue.600">
          Teacher Management
        </Heading>
        <Spacer />
        <HStack gap={3}>
          <Button
            colorScheme="blue"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
          >
            <FaPlus />
            Add Teacher
          </Button>
          <Button
            colorScheme="green"
            onClick={() => setShowUploadForm(true)}
          >
            <FaUpload />
            Upload Excel
          </Button>
        </HStack>
      </Flex>

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

              <HStack w="100%" gap={4}>
                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">Phone</Text>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </Box>
                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">Subjects</Text>
                  <VStack align="start" gap={2}>
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
                        const selectedSubject = e.target.value;
                        if (selectedSubject && !formData.subjects.includes(selectedSubject)) {
                          setFormData({ ...formData, subjects: [...formData.subjects, selectedSubject] });
                        }
                        e.target.value = ''; // Reset dropdown
                      }}
                    >
                      <option value="">Select a subject to add</option>
                      {AVAILABLE_SUBJECTS.filter(subject => !formData.subjects.includes(subject)).map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                    
                    {/* Display selected subjects */}
                    {formData.subjects.length > 0 && (
                      <Box w="100%">
                        <Text fontSize="sm" color="gray.600" mb={2}>Selected Subjects:</Text>
                        <HStack flexWrap="wrap" gap={2}>
                          {formData.subjects.map((subject) => (
                            <Badge
                              key={subject}
                              colorScheme="blue"
                              variant="solid"
                              px={2}
                              py={1}
                              cursor="pointer"
                              onClick={() => setFormData({ 
                                ...formData, 
                                subjects: formData.subjects.filter(s => s !== subject) 
                              })}
                            >
                              {subject} ×
                            </Badge>
                          ))}
                        </HStack>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Click on a subject to remove it
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              </HStack>

              <HStack w="100%" gap={4}>
                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">Classes (comma-separated)</Text>
                  <Input
                    value={formData.classes}
                    onChange={(e) => setFormData({ ...formData, classes: e.target.value })}
                    placeholder="Grade 1A, Grade 2B"
                  />
                </Box>
                <Box flex={1}>
                  {formData.isClassTeacher && (
                    <>
                      <Text mb={2} fontWeight="medium">Class Teacher For</Text>
                      <Input
                        value={formData.classTeacherFor}
                        onChange={(e) => setFormData({ ...formData, classTeacherFor: e.target.value })}
                        placeholder="Grade 1A"
                      />
                    </>
                  )}
                </Box>
              </HStack>

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
                Upload an Excel file with columns: Name, Email, Phone, Subjects, Classes, IsClassTeacher, ClassTeacherFor
              </Text>
              
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                p={1}
              />
              
              <Text fontSize="xs" color="gray.500">
                Subjects and Classes should be comma-separated. IsClassTeacher should be 'true' or 'false'.
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      <Box mb={4}>
        <Input
          placeholder="Search teachers by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maxW="400px"
        />
      </Box>

      <Box bg="white" borderRadius="md" shadow="sm" overflow="hidden">
        <Table.Root>
          <Table.Header bg="gray.50">
            <Table.Row>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader>Email</Table.ColumnHeader>
              <Table.ColumnHeader>Phone</Table.ColumnHeader>
              <Table.ColumnHeader>Subjects</Table.ColumnHeader>
              <Table.ColumnHeader>Classes</Table.ColumnHeader>
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
                  <VStack align="start" gap={1}>
                    {teacher.subjects.map((subject, index) => (
                      <Badge key={index} colorScheme="blue" size="sm">
                        {subject}
                      </Badge>
                    ))}
                  </VStack>
                </Table.Cell>
                <Table.Cell>
                  <VStack align="start" gap={1}>
                    {teacher.classes.map((className, index) => (
                      <Badge key={index} colorScheme="green" size="sm">
                        {className}
                      </Badge>
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