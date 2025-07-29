import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Input,
  VStack,
  HStack,
  Text,
  Card,
  Badge,
} from '@chakra-ui/react';
import { FaPlus, FaUpload, FaSearch, FaUser } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import { Student } from '../types/student';

const STANDARDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const DIVISIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    studentId: '',
    dateOfBirth: '',
    standard: '',
    division: ''
  });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique classes from students
  const getUniqueClasses = () => {
    const classes = Array.from(new Set(students.map(student => student.class)));
    return classes.sort();
  };

  // Filter students by selected class and search term
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Get student count by class
  const getStudentCountByClass = (className: string) => {
    if (className === 'all') return students.length;
    return students.filter(s => s.class === className).length;
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      rollNumber: '',
      studentId: '',
      dateOfBirth: '',
      standard: '',
      division: ''
    });
  };

  // Handle edit student
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      studentId: student.studentId,
      dateOfBirth: student.dateOfBirth,
      standard: student.standard,
      division: student.division,
    });
    setShowAddForm(true);
  };

  // Handle delete student
  const handleDeleteStudent = async (studentId: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/students/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Refresh students list
        await fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        // TODO: Show error message to user
      }
    }
  };

  // Submit new student
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (editingStudent) {
        // Update existing student
        await axios.put(`${API_BASE_URL}/api/students/${editingStudent.id}`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Create new student
        await axios.post(`${API_BASE_URL}/api/students`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Refresh students list
      await fetchStudents();
      
      // Reset form and close modal
      resetForm();
      setShowAddForm(false);
      setEditingStudent(null);
      
    } catch (error) {
      console.error('Error adding student:', error);
      // TODO: Show error message to user
    } finally {
      setSubmitting(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!uploadFile) return;

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await axios.post(`${API_BASE_URL}/api/students/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResult(response.data);
      
      // Refresh students list
      await fetchStudents();
      
      // Reset upload state
      setUploadFile(null);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadResult({
        success: false,
        studentsAdded: 0,
        errors: ['Failed to upload file. Please try again.']
      });
    } finally {
      setUploading(false);
    }
  };

  // Reset upload state
  const resetUpload = () => {
    setUploadFile(null);
    setUploadResult(null);
    setShowUploadForm(false);
  };

  const renderStudentCard = (student: Student) => (
    <Card.Root key={student.id} p={4} mb={3}>
      <Card.Body>
        <HStack justify="space-between">
          <VStack align="start" gap={1}>
            <Text fontWeight="bold" fontSize="lg">
              {student.name}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Roll No: {student.rollNumber} | Student ID: {student.studentId}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Class: {student.class} | DOB: {new Date(student.dateOfBirth).toLocaleDateString()}
            </Text>
          </VStack>
          <HStack gap={2}>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleEditStudent(student)}
            >
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              colorScheme="red"
              onClick={() => handleDeleteStudent(student.id)}
            >
              Delete
            </Button>
          </HStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  );

  return (
    <Box>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <Box>
          <Heading size="lg" color="blue.600" mb={2}>
            Student Management
          </Heading>
          <Text color="gray.600">
            Manage student records, add new students, or upload from Excel files
          </Text>
        </Box>

        {/* Actions */}
        <HStack justify="space-between" wrap="wrap" gap={4}>
          <HStack gap={3}>
            <Button
              colorScheme="blue"
              onClick={() => setShowAddForm(true)}
            >
              <FaPlus />
              Add Student
            </Button>
            <Button
              variant="outline"
              colorScheme="green"
              onClick={() => setShowUploadForm(true)}
            >
              <FaUpload />
              Upload Excel
            </Button>
          </HStack>

          <HStack maxW="300px">
            <Box color="gray.400">
              <FaSearch />
            </Box>
            <Input
              placeholder="Search students by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outline"
            />
          </HStack>
        </HStack>

        {/* Class Tabs and Student List */}
        <Box>
          {loading ? (
            <Text textAlign="center" py={8} color="gray.500">
              Loading students...
            </Text>
          ) : students.length === 0 ? (
            <Card.Root p={8} textAlign="center">
              <Card.Body>
                <VStack gap={4}>
                  <Box color="gray.400">
                    <FaUser size={48} />
                  </Box>
                  <VStack gap={2}>
                    <Text fontSize="lg" fontWeight="medium" color="gray.600">
                      No students yet
                    </Text>
                    <Text color="gray.500">
                      Start by adding a student or uploading an Excel file
                    </Text>
                  </VStack>
                  <HStack gap={3}>
                    <Button
                      colorScheme="blue"
                      onClick={() => setShowAddForm(true)}
                    >
                      <FaPlus />
                      Add First Student
                    </Button>
                    <Button
                      variant="outline"
                      colorScheme="green"
                      onClick={() => setShowUploadForm(true)}
                    >
                      <FaUpload />
                      Upload Excel
                    </Button>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          ) : (
            <Box>
              <HStack mb={4} gap={2}>
                <Button
                  size="sm"
                  variant={selectedClass === 'all' ? 'solid' : 'outline'}
                  onClick={() => setSelectedClass('all')}
                >
                  All Classes{' '}
                  <Badge ml={2} colorScheme="blue">
                    {getStudentCountByClass('all')}
                  </Badge>
                </Button>
                {getUniqueClasses().map((className) => (
                  <Button
                    key={className}
                    size="sm"
                    variant={selectedClass === className ? 'solid' : 'outline'}
                    onClick={() => setSelectedClass(className)}
                  >
                    {className}{' '}
                    <Badge ml={2} colorScheme="green">
                      {getStudentCountByClass(className)}
                    </Badge>
                  </Button>
                ))}
              </HStack>
              
              <Box>
                {filteredStudents.length === 0 ? (
                  <Card.Root p={6} textAlign="center">
                    <Card.Body>
                      <VStack gap={3}>
                        <Box color="gray.400">
                          <FaUser size={32} />
                        </Box>
                        <Text fontSize="md" color="gray.600">
                          {searchTerm 
                            ? `No students found matching "${searchTerm}" in ${selectedClass === 'all' ? 'any class' : selectedClass}`
                            : `No students in ${selectedClass === 'all' ? 'any class' : selectedClass}`
                          }
                        </Text>
                        {searchTerm && (
                          <Text fontSize="sm" color="gray.500">
                            Try a different search term or select another class
                          </Text>
                        )}
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                ) : (
                  <VStack align="stretch" gap={3}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Showing {filteredStudents.length} of {getStudentCountByClass(selectedClass)} students
                        {selectedClass !== 'all' && ` in ${selectedClass}`}
                        {searchTerm && ` matching "${searchTerm}"`}
                      </Text>
                    </HStack>
                    {filteredStudents.map(renderStudentCard)}
                  </VStack>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Add Student Form Modal */}
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
            <Card.Root maxW="md" w="90%" maxH="90vh" overflowY="auto">
              <Card.Header>
                <HStack justify="space-between">
                  <Heading size="lg">
                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                  </Heading>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
                      setEditingStudent(null);
                    }}
                  >
                    ✕
                  </Button>
                </HStack>
              </Card.Header>
            
              <form onSubmit={handleSubmitStudent}>
                <Card.Body>
                <VStack gap={4} align="stretch">
                  <Box>
                    <Text mb={2} fontWeight="medium">Student Name *</Text>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter student's full name"
                      required
                    />
                  </Box>

                  <HStack gap={4}>
                    <Box flex="1">
                      <Text mb={2} fontWeight="medium">Roll Number *</Text>
                      <Input
                        value={formData.rollNumber}
                        onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                        placeholder="e.g. R001"
                        required
                      />
                    </Box>

                    <Box flex="1">
                      <Text mb={2} fontWeight="medium">Student ID *</Text>
                      <Input
                        value={formData.studentId}
                        onChange={(e) => handleInputChange('studentId', e.target.value)}
                        placeholder="e.g. STU001"
                        required
                      />
                    </Box>
                  </HStack>

                  <Box>
                    <Text mb={2} fontWeight="medium">Date of Birth *</Text>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      required
                    />
                  </Box>

                  <HStack gap={4}>
                    <Box flex="1">
                      <Text mb={2} fontWeight="medium">Standard *</Text>
                      <select
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '14px'
                        }}
                        value={formData.standard}
                        onChange={(e) => handleInputChange('standard', e.target.value)}
                        required
                      >
                        <option value="">Select Standard</option>
                        {STANDARDS.map((standard) => (
                          <option key={standard} value={standard}>
                            {standard}
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
                </VStack>
                </Card.Body>

                <Card.Footer>
                <HStack gap={3}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
                      setEditingStudent(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    loading={submitting}
                  >
                    {editingStudent ? 'Update Student' : 'Add Student'}
                  </Button>
                </HStack>
                </Card.Footer>
              </form>
            </Card.Root>
          </Box>
        )}

        {/* Excel Upload Form Modal */}
        {showUploadForm && (
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
            <Card.Root maxW="lg" w="90%" maxH="90vh" overflowY="auto">
              <Card.Header>
                <HStack justify="space-between">
                  <Heading size="lg">Upload Students from Excel</Heading>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={resetUpload}
                  >
                    ✕
                  </Button>
                </HStack>
              </Card.Header>
              
              <Card.Body>
                <VStack gap={6} align="stretch">
                  {/* Upload Instructions */}
                  <Box>
                    <Text fontWeight="medium" mb={2}>Excel File Requirements:</Text>
                    <VStack align="start" gap={1} fontSize="sm" color="gray.600">
                      <Text>• First row should contain headers</Text>
                      <Text>• Required columns: Name, RollNumber (or Roll Number), StudentId (or Student ID), DateOfBirth (or Date of Birth), Standard, Division</Text>
                      <Text>• Date format: YYYY-MM-DD or MM/DD/YYYY</Text>
                      <Text>• File formats: .xlsx, .xls</Text>
                    </VStack>
                  </Box>

                  {/* File Upload */}
                  <Box>
                    <Text fontWeight="medium" mb={3}>Select Excel File:</Text>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      p={1}
                    />
                    {uploadFile && (
                      <Text fontSize="sm" color="green.600" mt={2}>
                        Selected: {uploadFile.name}
                      </Text>
                    )}
                  </Box>

                  {/* Upload Result */}
                  {uploadResult && (
                    <Box>
                      <Text fontWeight="medium" mb={3}>Upload Results:</Text>
                      <Card.Root 
                        bg={uploadResult.success ? 'green.50' : 'red.50'} 
                        borderColor={uploadResult.success ? 'green.200' : 'red.200'}
                        borderWidth="1px"
                      >
                        <Card.Body>
                          <VStack align="start" gap={2}>
                            <Text color={uploadResult.success ? 'green.700' : 'red.700'} fontWeight="medium">
                              {uploadResult.success ? '✅ Upload Successful' : '❌ Upload Failed'}
                            </Text>
                            
                            {uploadResult.studentsAdded > 0 && (
                              <Text color="green.600">
                                Successfully added {uploadResult.studentsAdded} students
                              </Text>
                            )}

                            {uploadResult.errors && uploadResult.errors.length > 0 && (
                              <Box>
                                <Text color="red.600" fontWeight="medium" mb={1}>Errors:</Text>
                                <VStack align="start" gap={1}>
                                  {uploadResult.errors.map((error: string, index: number) => (
                                    <Text key={index} fontSize="sm" color="red.600">
                                      • {error}
                                    </Text>
                                  ))}
                                </VStack>
                              </Box>
                            )}

                            {uploadResult.duplicates && uploadResult.duplicates.length > 0 && (
                              <Box>
                                <Text color="orange.600" fontWeight="medium" mb={1}>Duplicates skipped:</Text>
                                <VStack align="start" gap={1}>
                                  {uploadResult.duplicates.map((dup: any, index: number) => (
                                    <Text key={index} fontSize="sm" color="orange.600">
                                      • Row {dup.row}: {dup.name} (Roll: {dup.rollNumber})
                                    </Text>
                                  ))}
                                </VStack>
                              </Box>
                            )}
                          </VStack>
                        </Card.Body>
                      </Card.Root>
                    </Box>
                  )}
                </VStack>
              </Card.Body>

              <Card.Footer>
                <HStack gap={3} w="100%" justify="end">
                  <Button variant="outline" onClick={resetUpload}>
                    Cancel
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={handleFileUpload}
                    disabled={!uploadFile || uploading}
                    loading={uploading}
                  >
                    Upload Students
                  </Button>
                </HStack>
              </Card.Footer>
            </Card.Root>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default StudentManagement;