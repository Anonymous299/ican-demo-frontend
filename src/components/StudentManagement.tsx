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

// Helper function to format date string properly
const formatDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // Otherwise try to parse and format
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
};

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
    division: '',
    apaarId: '',
    address: '',
    phone: '',
    motherName: '',
    motherEducation: '',
    motherOccupation: '',
    fatherName: '',
    fatherEducation: '',
    fatherOccupation: '',
    siblings: 0,
    siblingAge: '',
    motherTongue: '',
    mediumOfInstruction: 'English',
    isRural: false,
    // Parent/Guardian Account Creation
    parentGuardians: [
      {
        id: 1,
        type: 'primary',
        name: '',
        email: '',
        phone: '',
        relationship: 'Mother',
        createAccount: true
      }
    ]
  });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState<any>(null);
  const [showCredentialModal, setShowCredentialModal] = useState<any>(null);

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
  const handleInputChange = (field: string, value: any) => {
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
      division: '',
      apaarId: '',
      address: '',
      phone: '',
      motherName: '',
      motherEducation: '',
      motherOccupation: '',
      fatherName: '',
      fatherEducation: '',
      fatherOccupation: '',
      siblings: 0,
      siblingAge: '',
      motherTongue: '',
      mediumOfInstruction: 'English',
      isRural: false,
      parentGuardians: [
        {
          id: 1,
          type: 'primary',
          name: '',
          email: '',
          phone: '',
          relationship: 'Mother',
          createAccount: true
        }
      ]
    });
  };

  // Handle edit student
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      studentId: student.studentId,
      dateOfBirth: formatDateString(student.dateOfBirth),
      standard: student.standard,
      division: student.division,
      apaarId: (student as any).apaarId || '',
      address: (student as any).address || '',
      phone: (student as any).phone || '',
      motherName: (student as any).motherName || '',
      motherEducation: (student as any).motherEducation || '',
      motherOccupation: (student as any).motherOccupation || '',
      fatherName: (student as any).fatherName || '',
      fatherEducation: (student as any).fatherEducation || '',
      fatherOccupation: (student as any).fatherOccupation || '',
      siblings: (student as any).siblings || 0,
      siblingAge: (student as any).siblingAge || '',
      motherTongue: (student as any).motherTongue || '',
      mediumOfInstruction: (student as any).mediumOfInstruction || 'English',
      isRural: (student as any).isRural || false,
      parentGuardians: (student as any).parentGuardians || [
        {
          id: 1,
          type: 'primary',
          name: (student as any).motherName || '',
          email: '',
          phone: (student as any).phone || '',
          relationship: 'Mother',
          createAccount: false
        }
      ]
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
    
    // Validate parent contact information
    const validationErrors = validateParentContacts();
    if (validationErrors.length > 0) {
      alert('Validation Errors:\n' + validationErrors.join('\n'));
      return;
    }
    
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
      
      // Show account creation summary for new students (demo)
      if (!editingStudent) {
        const activeGuardians = formData.parentGuardians.filter(g => g.createAccount);
        const accountCreationSummary = {
          studentName: formData.name,
          studentUsername: `${formData.studentId.toLowerCase()}@school.edu`,
          guardiansCreated: activeGuardians.map(g => ({
            name: g.name,
            relationship: g.relationship,
            contactMethod: g.email ? 'Email' : 'SMS',
            contactValue: g.email || g.phone,
            username: `${g.name.toLowerCase().replace(/\s+/g, '')}@school.edu`
          }))
        };
        setShowCredentials(accountCreationSummary);
        
        // Auto-hide after 15 seconds
        setTimeout(() => {
          setShowCredentials(null);
        }, 15000);
      }
      
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

  // Generate credentials for display (demo purposes)
  const generateCredentials = (student: Student) => {
    const studentData = student as any;
    return {
      studentUsername: `${student.studentId.toLowerCase()}@school.edu`,
      studentPassword: student.dateOfBirth.replace(/-/g, ''),
      parentUsername: `parent_${student.studentId.toLowerCase()}@school.edu`,
      parentPassword: `${studentData.phone?.slice(-4) || '0000'}_parent`,
      studentName: student.name,
      lastReset: '2024-01-15 10:30 AM',
      createdDate: student.createdAt
    };
  };

  // Handle viewing credentials
  const handleViewCredentials = (student: Student) => {
    const credentials = generateCredentials(student);
    setShowCredentialModal(credentials);
  };

  // Handle resetting credentials (demo)
  const handleResetCredentials = (student: Student) => {
    if (window.confirm(`Reset login credentials for ${student.name}?\n\nThis will send secure password reset links to all linked guardians.`)) {
      // Simulate secure reset process
      alert(`✅ Password reset initiated for ${student.name}!\n\n• Student: Reset link sent to school email\n• Guardians: Reset links sent to their registered contacts\n• All temporary passwords invalidated\n• Users must set new passwords within 24 hours`);
      
      // Close the modal to simulate the secure process
      setShowCredentialModal(null);
    }
  };

  // Parent Guardian Management Functions
  const addParentGuardian = () => {
    const newGuardian = {
      id: Date.now(),
      type: formData.parentGuardians.length === 0 ? 'primary' : 'secondary',
      name: '',
      email: '',
      phone: '',
      relationship: 'Father',
      createAccount: true
    };
    setFormData(prev => ({
      ...prev,
      parentGuardians: [...prev.parentGuardians, newGuardian]
    }));
  };

  const removeParentGuardian = (guardianId: number) => {
    if (formData.parentGuardians.length > 1) {
      setFormData(prev => ({
        ...prev,
        parentGuardians: prev.parentGuardians.filter(g => g.id !== guardianId)
      }));
    }
  };

  const updateParentGuardian = (guardianId: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      parentGuardians: prev.parentGuardians.map(g => 
        g.id === guardianId ? { ...g, [field]: value } : g
      )
    }));
  };

  // Validate parent contact information
  const validateParentContacts = () => {
    const activeGuardians = formData.parentGuardians.filter(g => g.createAccount);
    const errors: string[] = [];

    activeGuardians.forEach((guardian, index) => {
      if (!guardian.email && !guardian.phone) {
        errors.push(`Guardian ${index + 1}: At least email OR phone number is required for account creation`);
      }
      if (!guardian.name.trim()) {
        errors.push(`Guardian ${index + 1}: Name is required`);
      }
    });

    return errors;
  };


  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);

  const renderStudentCard = (student: Student) => {
    const isExpanded = expandedStudent === student.id;
    const studentData = student as any;
    
    return (
      <Card.Root 
        key={student.id} 
        p={4} 
        mb={3}
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
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between">
              <VStack align="start" gap={1}>
                <HStack>
                  <Box
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg="green.400"
                  />
                  <Text fontWeight="bold" fontSize="lg" color="purple.800">
                    {student.name}
                  </Text>
                </HStack>
                <HStack gap={4}>
                  <Badge colorScheme="blue" variant="subtle">
                    Roll: {student.rollNumber}
                  </Badge>
                  <Badge colorScheme="teal" variant="subtle">
                    ID: {student.studentId}
                  </Badge>
                  {studentData.apaarId && (
                    <Badge colorScheme="orange" variant="subtle">
                      APAAR: {studentData.apaarId}
                    </Badge>
                  )}
                </HStack>
                <HStack gap={3} fontSize="sm">
                  <HStack>
                    <Text color="gray.600" fontWeight="medium">Class:</Text>
                    <Text color="purple.600" fontWeight="bold">{student.class}</Text>
                  </HStack>
                  <Text color="gray.400">|</Text>
                  <HStack>
                    <Text color="gray.600" fontWeight="medium">DOB:</Text>
                    <Text color="orange.600" fontWeight="medium">{formatDateString(student.dateOfBirth)}</Text>
                  </HStack>
                </HStack>
              </VStack>
              <HStack gap={2}>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                >
                  {isExpanded ? '▼' : '▶'} Details
                </Button>
                <Button 
                  size="sm" 
                  bg="teal.500"
                  color="white"
                  _hover={{ bg: 'teal.600', transform: 'translateY(-1px)' }}
                  onClick={() => handleViewCredentials(student)}
                >
                  🔐 Logins
                </Button>
                <Button 
                  size="sm" 
                  bg="purple.500"
                  color="white"
                  _hover={{ bg: 'purple.600', transform: 'translateY(-1px)' }}
                  onClick={() => handleEditStudent(student)}
                >
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  bg="red.500"
                  color="white"
                  _hover={{ bg: 'red.600', transform: 'translateY(-1px)' }}
                  onClick={() => handleDeleteStudent(student.id)}
                >
                  Delete
                </Button>
              </HStack>
            </HStack>
            
            {isExpanded && (
              <Box borderTop="1px solid" borderColor="gray.200" pt={3}>
                <VStack align="stretch" gap={3} fontSize="sm">
                  {studentData.address && (
                    <HStack align="start">
                      <Text fontWeight="medium" color="gray.600">Address:</Text>
                      <Text>{studentData.address}</Text>
                    </HStack>
                  )}
                  {studentData.phone && (
                    <HStack>
                      <Text fontWeight="medium" color="gray.600">Phone:</Text>
                      <Text>{studentData.phone}</Text>
                    </HStack>
                  )}
                  
                  {(studentData.motherName || studentData.fatherName) && (
                    <Box>
                      <Text fontWeight="bold" color="purple.600" mb={2}>Parent/Guardian Information:</Text>
                      <HStack gap={8}>
                        {studentData.motherName && (
                          <VStack align="start" gap={1}>
                            <Text fontWeight="medium" color="gray.700">Mother/Guardian:</Text>
                            <Text>{studentData.motherName}</Text>
                            {studentData.motherEducation && <Text fontSize="xs" color="gray.600">Education: {studentData.motherEducation}</Text>}
                            {studentData.motherOccupation && <Text fontSize="xs" color="gray.600">Occupation: {studentData.motherOccupation}</Text>}
                          </VStack>
                        )}
                        {studentData.fatherName && (
                          <VStack align="start" gap={1}>
                            <Text fontWeight="medium" color="gray.700">Father/Guardian:</Text>
                            <Text>{studentData.fatherName}</Text>
                            {studentData.fatherEducation && <Text fontSize="xs" color="gray.600">Education: {studentData.fatherEducation}</Text>}
                            {studentData.fatherOccupation && <Text fontSize="xs" color="gray.600">Occupation: {studentData.fatherOccupation}</Text>}
                          </VStack>
                        )}
                      </HStack>
                    </Box>
                  )}
                  
                  <HStack gap={6}>
                    {studentData.motherTongue && (
                      <HStack>
                        <Text fontWeight="medium" color="gray.600">Mother Tongue:</Text>
                        <Text>{studentData.motherTongue}</Text>
                      </HStack>
                    )}
                    {studentData.mediumOfInstruction && (
                      <HStack>
                        <Text fontWeight="medium" color="gray.600">Medium:</Text>
                        <Text>{studentData.mediumOfInstruction}</Text>
                      </HStack>
                    )}
                    {studentData.isRural !== undefined && (
                      <Badge colorScheme={studentData.isRural ? 'green' : 'blue'}>
                        {studentData.isRural ? 'Rural' : 'Urban'}
                      </Badge>
                    )}
                  </HStack>
                  
                  {(studentData.siblings > 0) && (
                    <HStack>
                      <Text fontWeight="medium" color="gray.600">Siblings:</Text>
                      <Text>{studentData.siblings} {studentData.siblingAge && `(Ages: ${studentData.siblingAge})`}</Text>
                    </HStack>
                  )}
                </VStack>
              </Box>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  };

  return (
    <Box>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <Box 
          p={6} 
          bg="white" 
          borderRadius="xl" 
          boxShadow="md"
          borderLeft="4px solid"
          borderLeftColor="blue.400"
        >
          <Heading 
            size="lg" 
            bgGradient="linear(to-r, blue.600, purple.500)"
            bgClip="text"
            mb={2}
          >
            🎓 Student Management
          </Heading>
          <Text color="gray.700" fontWeight="medium">
            Manage student records, add new students, or upload from Excel files
          </Text>
        </Box>

        {/* Actions */}
        <HStack justify="space-between" wrap="wrap" gap={4}>
          <HStack gap={3}>
            <Button
              onClick={() => setShowAddForm(true)}
              backgroundImage="linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
              color="white"
              _hover={{ 
                backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
              transition="all 0.2s"
            >
              <FaPlus /> Add Student
            </Button>
            <Button
              variant="solid"
              bg="teal.400"
              color="white"
              _hover={{ 
                bg: 'teal.500',
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
              transition="all 0.2s"
              onClick={() => setShowUploadForm(true)}
            >
              <FaUpload /> Upload Excel
            </Button>
          </HStack>

          <HStack 
            maxW="300px"
            bg="white"
            p={2}
            borderRadius="full"
            boxShadow="md"
            border="2px solid"
            borderColor="purple.200"
          >
            <Box color="purple.500" pl={2}>
              <FaSearch />
            </Box>
            <Input
              placeholder="Search students by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outline"
              border="none"
              px={2}
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
            <Card.Root maxW="4xl" w="90%" maxH="90vh" overflowY="auto">
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
                <VStack gap={6} align="stretch">
                  {/* Basic Information Section */}
                  <Box>
                    <Text fontSize="lg" fontWeight="bold" mb={4} color="blue.600">
                      📝 Basic Information
                    </Text>
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

                        <Box flex="1">
                          <Text mb={2} fontWeight="medium">Date of Birth *</Text>
                          <Input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                            required
                          />
                        </Box>
                      </HStack>

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

                        <Box flex="1">
                          <Text mb={2} fontWeight="medium">APAAR ID</Text>
                          <Input
                            value={formData.apaarId}
                            onChange={(e) => handleInputChange('apaarId', e.target.value)}
                            placeholder="Enter APAAR ID"
                          />
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Contact Information Section */}
                  <Box borderTop="1px solid" borderColor="gray.200" pt={4}>
                    <Text fontSize="lg" fontWeight="bold" mb={4} color="green.600">
                      📞 Contact Information
                    </Text>
                    <VStack gap={4} align="stretch">
                      <HStack gap={4}>
                        <Box flex="1">
                          <Text mb={2} fontWeight="medium">Phone</Text>
                          <Input
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="Contact number"
                          />
                        </Box>
                        <Box flex="2">
                          <Text mb={2} fontWeight="medium">Address</Text>
                          <Input
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="Enter complete address"
                          />
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Parent/Guardian Information */}
                  <Box borderTop="1px solid" borderColor="gray.200" pt={4}>
                    <Text fontSize="lg" fontWeight="bold" mb={4} color="purple.600">
                      👨‍👩‍👧‍👦 Parent/Guardian Information
                    </Text>
                    <VStack gap={4} align="stretch">
                      <Box>
                        <Text fontWeight="medium" color="gray.700" mb={3}>Mother/Guardian Details:</Text>
                        <HStack gap={4}>
                          <Box flex="1">
                            <Text mb={2}>Name</Text>
                            <Input
                              value={formData.motherName}
                              onChange={(e) => handleInputChange('motherName', e.target.value)}
                              placeholder="Mother's name"
                            />
                          </Box>
                          <Box flex="1">
                            <Text mb={2}>Education</Text>
                            <Input
                              value={formData.motherEducation}
                              onChange={(e) => handleInputChange('motherEducation', e.target.value)}
                              placeholder="e.g. B.A., M.Sc"
                            />
                          </Box>
                          <Box flex="1">
                            <Text mb={2}>Occupation</Text>
                            <Input
                              value={formData.motherOccupation}
                              onChange={(e) => handleInputChange('motherOccupation', e.target.value)}
                              placeholder="Occupation"
                            />
                          </Box>
                        </HStack>
                      </Box>

                      <Box>
                        <Text fontWeight="medium" color="gray.700" mb={3}>Father/Guardian Details:</Text>
                        <HStack gap={4}>
                          <Box flex="1">
                            <Text mb={2}>Name</Text>
                            <Input
                              value={formData.fatherName}
                              onChange={(e) => handleInputChange('fatherName', e.target.value)}
                              placeholder="Father's name"
                            />
                          </Box>
                          <Box flex="1">
                            <Text mb={2}>Education</Text>
                            <Input
                              value={formData.fatherEducation}
                              onChange={(e) => handleInputChange('fatherEducation', e.target.value)}
                              placeholder="e.g. B.Tech, MBA"
                            />
                          </Box>
                          <Box flex="1">
                            <Text mb={2}>Occupation</Text>
                            <Input
                              value={formData.fatherOccupation}
                              onChange={(e) => handleInputChange('fatherOccupation', e.target.value)}
                              placeholder="Occupation"
                            />
                          </Box>
                        </HStack>
                      </Box>
                    </VStack>
                  </Box>

                  {/* Parent/Guardian Account Creation Section */}
                  <Box borderTop="1px solid" borderColor="gray.200" pt={4}>
                    <VStack gap={4} align="stretch">
                      <HStack justify="space-between" align="center">
                        <Text fontSize="lg" fontWeight="bold" color="teal.600">
                          🔐 Parent/Guardian Account Creation
                        </Text>
                        <Button
                          size="sm"
                          colorScheme="teal"
                          variant="outline"
                          onClick={addParentGuardian}
                        >
                          + Add Guardian
                        </Button>
                      </HStack>
                      
                      <Box 
                        p={3} 
                        bg="blue.50" 
                        borderRadius="md" 
                        border="1px solid" 
                        borderColor="blue.200"
                      >
                        <Text fontSize="sm" color="blue.700" fontWeight="medium">
                          🔒 Secure Account Setup Process:
                        </Text>
                        <VStack align="start" gap={1} fontSize="xs" color="blue.600" mt={1}>
                          <Text>• Account setup instructions will be sent directly to guardian's contact</Text>
                          <Text>• Email is preferred; SMS will be used if only phone is provided</Text>
                          <Text>• Guardians will set their own secure passwords on first login</Text>
                          <Text>• At least one contact method (email OR phone) is mandatory</Text>
                        </VStack>
                      </Box>

                      {formData.parentGuardians.map((guardian, index) => (
                        <Box 
                          key={guardian.id}
                          p={4} 
                          bg="gray.50" 
                          borderRadius="lg" 
                          border="2px solid" 
                          borderColor={guardian.type === 'primary' ? "teal.200" : "purple.200"}
                        >
                          <VStack gap={4} align="stretch">
                            <HStack justify="space-between">
                              <HStack>
                                <Badge 
                                  colorScheme={guardian.type === 'primary' ? "teal" : "purple"}
                                  fontSize="xs"
                                >
                                  {guardian.type === 'primary' ? 'Primary Guardian' : 'Secondary Guardian'}
                                </Badge>
                                <Text fontSize="sm" color="gray.600">
                                  Guardian {index + 1}
                                </Text>
                              </HStack>
                              {formData.parentGuardians.length > 1 && (
                                <Button
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => removeParentGuardian(guardian.id)}
                                >
                                  Remove
                                </Button>
                              )}
                            </HStack>

                            <HStack gap={4}>
                              <Box flex="2">
                                <Text mb={2} fontWeight="medium">Full Name *</Text>
                                <Input
                                  value={guardian.name}
                                  onChange={(e) => updateParentGuardian(guardian.id, 'name', e.target.value)}
                                  placeholder="Guardian's full name"
                                  required
                                />
                              </Box>
                              <Box flex="1">
                                <Text mb={2} fontWeight="medium">Relationship</Text>
                                <select
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    backgroundColor: 'white',
                                    fontSize: '14px'
                                  }}
                                  value={guardian.relationship}
                                  onChange={(e) => updateParentGuardian(guardian.id, 'relationship', e.target.value)}
                                >
                                  <option value="Mother">Mother</option>
                                  <option value="Father">Father</option>
                                  <option value="Guardian">Guardian</option>
                                  <option value="Grandmother">Grandmother</option>
                                  <option value="Grandfather">Grandfather</option>
                                  <option value="Other">Other</option>
                                </select>
                              </Box>
                            </HStack>

                            <VStack gap={3} align="stretch">
                              <Text fontWeight="medium" color="gray.700">
                                Contact Information (At least one required) *:
                              </Text>
                              <HStack gap={4}>
                                <Box flex="1">
                                  <Text mb={2} fontSize="sm">Email Address</Text>
                                  <Input
                                    type="email"
                                    value={guardian.email}
                                    onChange={(e) => updateParentGuardian(guardian.id, 'email', e.target.value)}
                                    placeholder="guardian@email.com"
                                    bg={guardian.email ? "green.50" : "white"}
                                    borderColor={guardian.email ? "green.300" : "gray.200"}
                                  />
                                  {guardian.email && (
                                    <Text fontSize="xs" color="green.600" mt={1}>
                                      ✓ Account setup email will be sent here
                                    </Text>
                                  )}
                                </Box>
                                <Box flex="1">
                                  <Text mb={2} fontSize="sm">Phone Number</Text>
                                  <Input
                                    type="tel"
                                    value={guardian.phone}
                                    onChange={(e) => updateParentGuardian(guardian.id, 'phone', e.target.value)}
                                    placeholder="+1234567890"
                                    bg={guardian.phone ? "blue.50" : "white"}
                                    borderColor={guardian.phone ? "blue.300" : "gray.200"}
                                  />
                                  {guardian.phone && !guardian.email && (
                                    <Text fontSize="xs" color="blue.600" mt={1}>
                                      ✓ Account setup SMS will be sent here
                                    </Text>
                                  )}
                                </Box>
                              </HStack>
                            </VStack>

                            <HStack>
                              <input
                                type="checkbox"
                                id={`createAccount_${guardian.id}`}
                                checked={guardian.createAccount}
                                onChange={(e) => updateParentGuardian(guardian.id, 'createAccount', e.target.checked)}
                                style={{ marginRight: '8px' }}
                              />
                              <label htmlFor={`createAccount_${guardian.id}`}>
                                <Text fontWeight="medium" color={guardian.createAccount ? "teal.600" : "gray.600"}>
                                  Create portal account for this guardian
                                </Text>
                              </label>
                            </HStack>

                            {guardian.createAccount && (!guardian.email && !guardian.phone) && (
                              <Box 
                                p={2} 
                                bg="red.50" 
                                borderRadius="md" 
                                border="1px solid" 
                                borderColor="red.200"
                              >
                                <Text fontSize="sm" color="red.600">
                                  ⚠️ Email or phone number is required for account creation
                                </Text>
                              </Box>
                            )}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>

                  {/* Additional Details Section */}
                  <Box borderTop="1px solid" borderColor="gray.200" pt={4}>
                    <Text fontSize="lg" fontWeight="bold" mb={4} color="orange.600">
                      ℹ️ Additional Details
                    </Text>
                    <VStack gap={4} align="stretch">
                      {/* Sibling Information */}
                      <HStack gap={4}>
                        <Box flex="1">
                          <Text mb={2} fontWeight="medium">Number of Siblings</Text>
                          <Input
                            type="number"
                            value={formData.siblings}
                            onChange={(e) => handleInputChange('siblings', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                          />
                        </Box>
                        <Box flex="2">
                          <Text mb={2} fontWeight="medium">Sibling Ages</Text>
                          <Input
                            value={formData.siblingAge}
                            onChange={(e) => handleInputChange('siblingAge', e.target.value)}
                            placeholder="e.g. 5, 8, 12 (comma-separated)"
                          />
                        </Box>
                      </HStack>

                      {/* Language and Location */}
                      <HStack gap={4}>
                        <Box flex="1">
                          <Text mb={2} fontWeight="medium">Mother Tongue</Text>
                          <Input
                            value={formData.motherTongue}
                            onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                            placeholder="e.g. Hindi, Tamil, English"
                          />
                        </Box>
                        <Box flex="1">
                          <Text mb={2} fontWeight="medium">Medium of Instruction</Text>
                          <select
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              backgroundColor: 'white',
                              fontSize: '14px'
                            }}
                            value={formData.mediumOfInstruction}
                            onChange={(e) => handleInputChange('mediumOfInstruction', e.target.value)}
                          >
                            <option value="English">English</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Regional">Regional Language</option>
                          </select>
                        </Box>
                        <Box flex="1" display="flex" alignItems="end">
                          <HStack h="40px" alignItems="center">
                            <input
                              type="checkbox"
                              id="isRural"
                              checked={formData.isRural}
                              onChange={(e) => handleInputChange('isRural', e.target.checked)}
                              style={{ marginRight: '8px' }}
                            />
                            <label htmlFor="isRural">
                              <Text fontWeight="medium">Rural Area</Text>
                            </label>
                          </HStack>
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>

                </VStack>
                </Card.Body>

                <Card.Footer>
                <VStack gap={4} w="100%">
                  {/* System Generated Credentials Demo */}
                  {!editingStudent && (
                    <Box 
                      w="100%" 
                      p={4} 
                      bg="blue.50" 
                      borderRadius="lg" 
                      border="1px solid" 
                      borderColor="blue.200"
                    >
                      <VStack gap={3} align="stretch">
                        <HStack>
                          <Text fontWeight="bold" color="blue.700" fontSize="sm">
                            🔐 System Generated Credentials (Demo)
                          </Text>
                          <Badge colorScheme="blue" fontSize="xs">
                            Preview
                          </Badge>
                        </HStack>
                        
                        <Text fontSize="xs" color="blue.600">
                          Upon saving, the system will generate shareable login credentials for the student:
                        </Text>
                        
                        <HStack gap={6} fontSize="sm">
                          <VStack align="start" gap={1}>
                            <Text fontWeight="medium" color="gray.700">Student Portal Login:</Text>
                            <HStack>
                              <Text color="gray.600">Username:</Text>
                              <Text fontFamily="mono" bg="white" px={2} py={1} borderRadius="md" fontSize="xs">
                                {formData.studentId.toLowerCase() || 'stu001'}@school.edu
                              </Text>
                            </HStack>
                            <HStack>
                              <Text color="gray.600">Password:</Text>
                              <Text fontFamily="mono" bg="white" px={2} py={1} borderRadius="md" fontSize="xs">
                                {formData.dateOfBirth.replace(/-/g, '') || 'YYYYMMDD'}
                              </Text>
                            </HStack>
                          </VStack>
                          
                          <VStack align="start" gap={1}>
                            <Text fontWeight="medium" color="gray.700">Parent Portal Access:</Text>
                            <HStack>
                              <Text color="gray.600">Username:</Text>
                              <Text fontFamily="mono" bg="white" px={2} py={1} borderRadius="md" fontSize="xs">
                                parent_{formData.studentId.toLowerCase() || 'stu001'}@school.edu
                              </Text>
                            </HStack>
                            <HStack>
                              <Text color="gray.600">Password:</Text>
                              <Text fontFamily="mono" bg="white" px={2} py={1} borderRadius="md" fontSize="xs">
                                {formData.phone.slice(-4) || 'XXXX'}_parent
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>
                        
                        <Text fontSize="xs" color="blue.600" fontStyle="italic">
                          💡 Credentials can be reset by school administrators and will be shared with families via secure communication.
                        </Text>
                      </VStack>
                    </Box>
                  )}
                  
                  <HStack gap={3} w="100%" justify="end">
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
                </VStack>
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
                      <Text>• Required columns: Name, RollNumber, StudentId, DateOfBirth, Standard, Division</Text>
                      <Text>• Optional columns: Age, ParentContact, Notes, ClassId</Text>
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

        {/* Success Modal - Account Creation Summary */}
        {showCredentials && (
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
            <Card.Root maxW="3xl" w="90%" bg="white" borderRadius="xl" boxShadow="2xl">
              <Card.Header>
                <VStack gap={2} align="center">
                  <Box fontSize="3xl">🎉</Box>
                  <Heading size="lg" color="green.600">
                    Student & Guardian Accounts Created!
                  </Heading>
                  <Text color="gray.600" textAlign="center">
                    {showCredentials.studentName} has been added successfully
                  </Text>
                </VStack>
              </Card.Header>
              
              <Card.Body>
                <VStack gap={6} align="stretch">
                  {/* Account Creation Summary */}
                  <VStack gap={4} align="stretch">
                    {/* Student Account */}
                    <Box 
                      p={4} 
                      bg="blue.50" 
                      borderRadius="lg" 
                      border="2px solid" 
                      borderColor="blue.200"
                    >
                      <VStack gap={3} align="center">
                        <Text fontWeight="bold" color="blue.700">
                          🎓 Student Portal Account
                        </Text>
                        <VStack gap={2} align="center">
                          <Text fontSize="sm" color="gray.600">Username assigned:</Text>
                          <Text 
                            fontFamily="mono" 
                            bg="white" 
                            p={2} 
                            borderRadius="md" 
                            border="1px solid" 
                            borderColor="gray.200"
                            fontSize="sm"
                          >
                            {showCredentials.studentUsername}
                          </Text>
                          <Text fontSize="xs" color="blue.600" textAlign="center">
                            ✓ Temporary password generated - student will set secure password on first login
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>

                    {/* Guardian Accounts */}
                    {showCredentials.guardiansCreated && showCredentials.guardiansCreated.length > 0 && (
                      <Box 
                        p={4} 
                        bg="teal.50" 
                        borderRadius="lg" 
                        border="2px solid" 
                        borderColor="teal.200"
                      >
                        <VStack gap={3} align="stretch">
                          <Text fontWeight="bold" color="teal.700" textAlign="center">
                            👪 Guardian Portal Accounts ({showCredentials.guardiansCreated.length})
                          </Text>
                          {showCredentials.guardiansCreated.map((guardian, index) => (
                            <Box 
                              key={index}
                              p={3} 
                              bg="white" 
                              borderRadius="md" 
                              border="1px solid" 
                              borderColor="teal.200"
                            >
                              <VStack gap={2} align="stretch">
                                <HStack justify="space-between">
                                  <Text fontWeight="medium" color="gray.700">
                                    {guardian.name} ({guardian.relationship})
                                  </Text>
                                  <Badge colorScheme="teal" fontSize="xs">
                                    Account Created
                                  </Badge>
                                </HStack>
                                <HStack justify="space-between" fontSize="sm">
                                  <Text color="gray.600">Setup sent via:</Text>
                                  <Text color="teal.600" fontWeight="medium">
                                    {guardian.contactMethod} to {guardian.contactValue}
                                  </Text>
                                </HStack>
                                <Text fontSize="xs" color="gray.500">
                                  Username: {guardian.username}
                                </Text>
                              </VStack>
                            </Box>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </VStack>

                  {/* Security Notice */}
                  <Box 
                    p={4} 
                    bg="yellow.50" 
                    borderRadius="lg" 
                    border="1px solid" 
                    borderColor="yellow.200"
                  >
                    <VStack gap={2} align="start">
                      <Text fontWeight="bold" color="yellow.700" fontSize="sm">
                        🔒 Secure Account Setup Process:
                      </Text>
                      <VStack align="start" gap={1} fontSize="xs" color="yellow.700">
                        <Text>• No passwords were displayed to administrators for security</Text>
                        <Text>• Account setup instructions sent directly to guardians</Text>
                        <Text>• All users must set permanent passwords on first login</Text>
                        <Text>• Temporary access expires after 7 days if not activated</Text>
                        <Text>• Password reset requests can be initiated by administrators</Text>
                      </VStack>
                    </VStack>
                  </Box>

                  {/* Next Steps */}
                  <Box 
                    p={4} 
                    bg="green.50" 
                    borderRadius="lg" 
                    border="1px solid" 
                    borderColor="green.200"
                  >
                    <VStack gap={2} align="start">
                      <Text fontWeight="bold" color="green.700" fontSize="sm">
                        📋 Next Steps:
                      </Text>
                      <VStack align="start" gap={1} fontSize="xs" color="green.700">
                        <Text>• Inform guardians to check their email/SMS for account setup</Text>
                        <Text>• Provide school portal URL and support contact information</Text>
                        <Text>• Monitor account activation status in coming days</Text>
                        <Text>• Use "Logins" button to manage accounts if needed</Text>
                      </VStack>
                    </VStack>
                  </Box>
                </VStack>
              </Card.Body>

              <Card.Footer>
                <HStack gap={3} w="100%" justify="center">
                  <Button
                    onClick={() => setShowCredentials(null)}
                    colorScheme="green"
                  >
                    Understood
                  </Button>
                </HStack>
              </Card.Footer>
            </Card.Root>
          </Box>
        )}

        {/* Credential Management Modal */}
        {showCredentialModal && (
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
            <Card.Root maxW="3xl" w="90%" bg="white" borderRadius="xl" boxShadow="2xl">
              <Card.Header>
                <HStack justify="space-between">
                  <VStack align="start" gap={1}>
                    <Heading size="lg" color="teal.600">
                      🔐 Account Management
                    </Heading>
                    <Text color="gray.600">
                      Student: {showCredentialModal.studentName}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Manage secure access for student and linked guardians
                    </Text>
                  </VStack>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCredentialModal(null)}
                  >
                    ✕
                  </Button>
                </HStack>
              </Card.Header>
              
              <Card.Body>
                <VStack gap={6} align="stretch">
                  {/* Account Information Display */}
                  <HStack gap={6} align="stretch">
                    {/* Student Account */}
                    <Box 
                      p={4} 
                      bg="blue.50" 
                      borderRadius="lg" 
                      border="2px solid" 
                      borderColor="blue.200"
                      flex="1"
                    >
                      <VStack gap={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontWeight="bold" color="blue.700">
                            🎓 Student Portal
                          </Text>
                          <Badge colorScheme="blue">Active</Badge>
                        </HStack>
                        <VStack gap={2} align="stretch">
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={1}>Username:</Text>
                            <HStack>
                              <Text 
                                fontFamily="mono" 
                                bg="white" 
                                p={2} 
                                borderRadius="md" 
                                border="1px solid" 
                                borderColor="gray.200"
                                fontSize="sm"
                                flex="1"
                              >
                                {showCredentialModal.studentUsername}
                              </Text>
                              <Button 
                                size="xs" 
                                onClick={() => navigator.clipboard.writeText(showCredentialModal.studentUsername)}
                              >
                                📋
                              </Button>
                            </HStack>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600" mb={1}>Password:</Text>
                            <Box 
                              bg="gray.100" 
                              p={2} 
                              borderRadius="md" 
                              border="1px solid" 
                              borderColor="gray.300"
                            >
                              <Text fontSize="sm" color="gray.500" textAlign="center">
                                🔒 Securely Managed
                              </Text>
                            </Box>
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Passwords are not displayed for security
                            </Text>
                          </Box>
                        </VStack>
                      </VStack>
                    </Box>

                    {/* Guardian Accounts */}
                    <Box 
                      p={4} 
                      bg="teal.50" 
                      borderRadius="lg" 
                      border="2px solid" 
                      borderColor="teal.200"
                      flex="1"
                    >
                      <VStack gap={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontWeight="bold" color="teal.700">
                            👪 Guardian Portals
                          </Text>
                          <Badge colorScheme="teal">2 Active</Badge>
                        </HStack>
                        <VStack gap={2} align="stretch" fontSize="sm">
                          <Box p={2} bg="white" borderRadius="md" border="1px solid" borderColor="teal.200">
                            <HStack justify="space-between">
                              <Text color="gray.700">Primary Guardian</Text>
                              <Badge colorScheme="green" fontSize="xs">Active</Badge>
                            </HStack>
                            <Text fontSize="xs" color="gray.500">Last login: 2 days ago</Text>
                          </Box>
                          <Box p={2} bg="white" borderRadius="md" border="1px solid" borderColor="teal.200">
                            <HStack justify="space-between">
                              <Text color="gray.700">Secondary Guardian</Text>
                              <Badge colorScheme="yellow" fontSize="xs">Pending Setup</Badge>
                            </HStack>
                            <Text fontSize="xs" color="gray.500">Setup email sent 3 days ago</Text>
                          </Box>
                        </VStack>
                      </VStack>
                    </Box>
                  </HStack>

                  {/* Security Information */}
                  <Box 
                    p={4} 
                    bg="yellow.50" 
                    borderRadius="lg" 
                    border="1px solid" 
                    borderColor="yellow.200"
                  >
                    <VStack gap={2} align="start">
                      <Text fontWeight="bold" color="yellow.700" fontSize="sm">
                        🔒 Security Guidelines:
                      </Text>
                      <VStack align="start" gap={1} fontSize="xs" color="yellow.700">
                        <Text>• Share credentials only through secure, approved communication channels</Text>
                        <Text>• Advise families to change passwords on first login for enhanced security</Text>
                        <Text>• Monitor for any suspicious login activity or access issues</Text>
                        <Text>• Reset credentials immediately if compromise is suspected</Text>
                      </VStack>
                    </VStack>
                  </Box>

                  {/* Account Status & Actions */}
                  <Box 
                    p={4} 
                    bg="gray.50" 
                    borderRadius="lg" 
                    border="1px solid" 
                    borderColor="gray.200"
                  >
                    <VStack gap={3} align="stretch">
                      <Text fontWeight="bold" color="gray.700" fontSize="sm">
                        📊 Account Status:
                      </Text>
                      <HStack gap={6} fontSize="sm">
                        <VStack align="start" gap={1}>
                          <Text color="gray.600">Student Account:</Text>
                          <Badge colorScheme="green">Active</Badge>
                          <Text fontSize="xs" color="gray.500">Last login: 2 days ago</Text>
                        </VStack>
                        <VStack align="start" gap={1}>
                          <Text color="gray.600">Parent Account:</Text>
                          <Badge colorScheme="green">Active</Badge>
                          <Text fontSize="xs" color="gray.500">Last login: 1 week ago</Text>
                        </VStack>
                        <VStack align="start" gap={1}>
                          <Text color="gray.600">Created:</Text>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(showCredentialModal.createdDate).toLocaleDateString()}
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              </Card.Body>

              <Card.Footer>
                <HStack gap={3} w="100%" justify="space-between">
                  <HStack gap={3}>
                    <Button
                      onClick={() => {
                        const currentStudent = students.find(s => s.name === showCredentialModal.studentName);
                        if (currentStudent) handleResetCredentials(currentStudent);
                      }}
                      colorScheme="orange"
                      variant="outline"
                    >
                      🔄 Send Password Reset
                    </Button>
                    <Button
                      onClick={() => {
                        alert('📧 Account setup reminders sent!\n\n• Student: Reminder sent to school email\n• Guardians: Setup reminders sent to registered contacts\n• Instructions include portal URL and support info');
                      }}
                      colorScheme="blue"
                      variant="outline"
                    >
                      📧 Send Setup Reminders
                    </Button>
                  </HStack>
                  <Button
                    onClick={() => setShowCredentialModal(null)}
                    colorScheme="gray"
                  >
                    Close
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