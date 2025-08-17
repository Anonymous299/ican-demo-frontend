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
  IconButton,
  createToaster,
} from '@chakra-ui/react';
import { FaCalendarAlt, FaCheck, FaTimes, FaClock, FaEdit, FaEye, FaPlus } from 'react-icons/fa';
import { API_BASE_URL } from '../config/constants';

interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  timeIn: string | null;
  timeOut: string | null;
  remarks: string;
  markedBy: string;
  createdAt: string;
}

interface AttendanceSummary {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: string;
  absenteeRate: string;
}

interface Student {
  id: number;
  name: string;
  class: string;
  rollNumber: string;
}

interface Class {
  id: number;
  name: string;
  grade: string;
  division: string;
}

const AttendanceManagement: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [showBulkMarkModal, setShowBulkMarkModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toaster = createToaster({
    placement: 'top-right',
  });

  const [markForm, setMarkForm] = useState({
    studentId: '',
    classId: '',
    date: selectedDate,
    status: 'present' as 'present' | 'absent' | 'late',
    timeIn: '',
    timeOut: '',
    remarks: ''
  });

  const [bulkAttendance, setBulkAttendance] = useState<{[key: number]: {status: 'present' | 'absent' | 'late', remarks: string}}>({});

  useEffect(() => {
    fetchAttendance();
    fetchSummary();
    fetchStudents();
    fetchClasses();
  }, [selectedDate, selectedClass]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/api/attendance?date=${selectedDate}`;
      
      if (selectedClass) {
        url += `&classId=${selectedClass}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to fetch attendance records',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/api/attendance/summary?date=${selectedDate}`;
      
      if (selectedClass) {
        url += `&classId=${selectedClass}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
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

  const handleMarkAttendance = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_BASE_URL}/api/attendance`, markForm, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchAttendance();
      await fetchSummary();
      setShowMarkAttendanceModal(false);
      resetMarkForm();
      
      toaster.create({
        title: 'Success',
        description: 'Attendance marked successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toaster.create({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to mark attendance',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkMarkAttendance = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const attendanceRecords = Object.entries(bulkAttendance).map(([studentId, data]) => ({
        studentId: parseInt(studentId),
        classId: parseInt(selectedClass),
        date: selectedDate,
        status: data.status,
        timeIn: data.status === 'absent' ? null : '09:00:00',
        timeOut: data.status === 'absent' ? null : '15:30:00',
        remarks: data.remarks
      }));

      if (attendanceRecords.length === 0) {
        toaster.create({
          title: 'Error',
          description: 'No attendance records to mark',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      await axios.post(`${API_BASE_URL}/api/attendance/bulk`, {
        attendanceRecords
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchAttendance();
      await fetchSummary();
      setShowBulkMarkModal(false);
      setBulkAttendance({});
      
      toaster.create({
        title: 'Success',
        description: `Bulk attendance marked for ${attendanceRecords.length} students`,
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error bulk marking attendance:', error);
      toaster.create({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to mark bulk attendance',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetMarkForm = () => {
    setMarkForm({
      studentId: '',
      classId: '',
      date: selectedDate,
      status: 'present',
      timeIn: '',
      timeOut: '',
      remarks: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'green';
      case 'absent': return 'red';
      case 'late': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <FaCheck />;
      case 'absent': return <FaTimes />;
      case 'late': return <FaClock />;
      default: return null;
    }
  };

  const getStudentsForSelectedClass = () => {
    if (!selectedClass) return [];
    return students.filter(student => {
      const classInfo = classes.find(c => c.id === parseInt(selectedClass));
      return classInfo && student.class === classInfo.name;
    });
  };

  const getStudentsWithoutAttendance = () => {
    const studentsInClass = getStudentsForSelectedClass();
    const studentsWithAttendance = attendance.map(a => a.studentId);
    return studentsInClass.filter(student => !studentsWithAttendance.includes(student.id));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="50vh">
        <Text>Loading attendance data...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Heading size="lg" color="blue.700">
            📋 Attendance Management
          </Heading>
          <HStack>
            <Button
              colorScheme="blue"
              onClick={() => {
                resetMarkForm();
                setShowMarkAttendanceModal(true);
              }}
            >
              <FaPlus />
              Mark Attendance
            </Button>
            {selectedClass && (
              <Button
                colorScheme="green"
                onClick={() => setShowBulkMarkModal(true)}
              >
                <FaEdit />
                Bulk Mark Class
              </Button>
            )}
          </HStack>
        </HStack>

        {/* Filters */}
        <Card.Root p={4} bg="gray.50">
          <HStack gap={4} flexWrap="wrap">
            <Box>
              <Text mb={2} fontWeight="medium">Date</Text>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                bg="white"
              />
            </Box>
            <Box>
              <Text mb={2} fontWeight="medium">Class (Optional)</Text>
              <select
                style={{
                  width: '200px',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: '14px'
                }}
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </Box>
          </HStack>
        </Card.Root>

        {/* Summary Stats */}
        {summary && (
          <SimpleGrid columns={{ base: 2, md: 5 }} gap={4}>
            <Card.Root p={4} bg="blue.50" borderColor="blue.200" borderWidth={1}>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {summary.totalRecords}
                </Text>
                <Text fontSize="sm" color="blue.600">Total Records</Text>
              </VStack>
            </Card.Root>
            
            <Card.Root p={4} bg="green.50" borderColor="green.200" borderWidth={1}>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {summary.presentCount}
                </Text>
                <Text fontSize="sm" color="green.600">Present</Text>
              </VStack>
            </Card.Root>
            
            <Card.Root p={4} bg="red.50" borderColor="red.200" borderWidth={1}>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="red.600">
                  {summary.absentCount}
                </Text>
                <Text fontSize="sm" color="red.600">Absent</Text>
              </VStack>
            </Card.Root>
            
            <Card.Root p={4} bg="orange.50" borderColor="orange.200" borderWidth={1}>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                  {summary.lateCount}
                </Text>
                <Text fontSize="sm" color="orange.600">Late</Text>
              </VStack>
            </Card.Root>
            
            <Card.Root p={4} bg="purple.50" borderColor="purple.200" borderWidth={1}>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                  {summary.attendanceRate}%
                </Text>
                <Text fontSize="sm" color="purple.600">Attendance Rate</Text>
              </VStack>
            </Card.Root>
          </SimpleGrid>
        )}

        {/* Attendance Records */}
        <VStack align="stretch" gap={4}>
          <Heading size="md" color="gray.700">
            📅 Attendance Records for {selectedDate}
          </Heading>
          
          {attendance.length === 0 ? (
            <Card.Root p={8} textAlign="center">
              <Text color="gray.500">No attendance records found for the selected date and filters.</Text>
            </Card.Root>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {attendance.map((record) => (
                <Card.Root 
                  key={record.id}
                  p={4}
                  bg="white"
                  borderWidth={2}
                  borderColor={`${getStatusColor(record.status)}.200`}
                  _hover={{ 
                    borderColor: `${getStatusColor(record.status)}.400`,
                    transform: 'translateY(-2px)',
                    boxShadow: 'md'
                  }}
                  transition="all 0.2s"
                >
                  <Card.Body>
                    <VStack align="start" gap={3}>
                      <HStack justify="space-between" w="100%">
                        <VStack align="start" gap={1}>
                          <Text fontWeight="bold" fontSize="sm">{record.studentName}</Text>
                          <Text fontSize="xs" color="gray.600">{record.className}</Text>
                        </VStack>
                        <Badge 
                          colorScheme={getStatusColor(record.status)} 
                          fontSize="xs"
                          display="flex"
                          alignItems="center"
                          gap={1}
                        >
                          {getStatusIcon(record.status)}
                          {record.status.toUpperCase()}
                        </Badge>
                      </HStack>

                      {record.timeIn && (
                        <HStack gap={4} fontSize="xs" color="gray.600">
                          <Text>In: {record.timeIn}</Text>
                          {record.timeOut && <Text>Out: {record.timeOut}</Text>}
                        </HStack>
                      )}

                      {record.remarks && (
                        <Text fontSize="xs" color="gray.700" fontStyle="italic">
                          "{record.remarks}"
                        </Text>
                      )}

                      <HStack justify="space-between" w="100%" fontSize="xs" color="gray.500">
                        <Text>By: {record.markedBy}</Text>
                        <Text>{new Date(record.createdAt).toLocaleTimeString()}</Text>
                      </HStack>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </VStack>

      {/* Mark Attendance Modal */}
      {showMarkAttendanceModal && (
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
          <Card.Root maxW="lg" w="95%" maxH="90vh" overflowY="auto">
            <Card.Header>
              <HStack justify="space-between">
                <Heading size="lg">📝 Mark Attendance</Heading>
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowMarkAttendanceModal(false)}
                >
                  <FaTimes />
                </IconButton>
              </HStack>
            </Card.Header>

            <Card.Body>
              <VStack gap={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Box>
                    <Text mb={2} fontWeight="medium">Student *</Text>
                    <select
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        fontSize: '14px'
                      }}
                      value={markForm.studentId}
                      onChange={(e) => setMarkForm(prev => ({ ...prev, studentId: e.target.value }))}
                    >
                      <option value="">Select Student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.class})
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
                      value={markForm.classId}
                      onChange={(e) => setMarkForm(prev => ({ ...prev, classId: e.target.value }))}
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
                    <Text mb={2} fontWeight="medium">Date *</Text>
                    <Input
                      type="date"
                      value={markForm.date}
                      onChange={(e) => setMarkForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="medium">Status *</Text>
                    <select
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        fontSize: '14px'
                      }}
                      value={markForm.status}
                      onChange={(e) => setMarkForm(prev => ({ ...prev, status: e.target.value as 'present' | 'absent' | 'late' }))}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </Box>
                </SimpleGrid>

                {markForm.status !== 'absent' && (
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box>
                      <Text mb={2} fontWeight="medium">Time In</Text>
                      <Input
                        type="time"
                        value={markForm.timeIn}
                        onChange={(e) => setMarkForm(prev => ({ ...prev, timeIn: e.target.value }))}
                      />
                    </Box>

                    <Box>
                      <Text mb={2} fontWeight="medium">Time Out</Text>
                      <Input
                        type="time"
                        value={markForm.timeOut}
                        onChange={(e) => setMarkForm(prev => ({ ...prev, timeOut: e.target.value }))}
                      />
                    </Box>
                  </SimpleGrid>
                )}

                <Box>
                  <Text mb={2} fontWeight="medium">Remarks</Text>
                  <Input
                    value={markForm.remarks}
                    onChange={(e) => setMarkForm(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Optional remarks or notes"
                  />
                </Box>
              </VStack>
            </Card.Body>

            <Card.Footer>
              <HStack gap={3} w="100%" justify="end">
                <Button
                  variant="outline"
                  onClick={() => setShowMarkAttendanceModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleMarkAttendance}
                  loading={submitting}
                  disabled={!markForm.studentId || !markForm.classId || !markForm.date}
                >
                  Mark Attendance
                </Button>
              </HStack>
            </Card.Footer>
          </Card.Root>
        </Box>
      )}

      {/* Bulk Mark Attendance Modal */}
      {showBulkMarkModal && (
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
          <Card.Root maxW="4xl" w="95%" maxH="90vh" overflowY="auto">
            <Card.Header>
              <HStack justify="space-between">
                <Heading size="lg">📋 Bulk Mark Attendance - {selectedDate}</Heading>
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBulkMarkModal(false)}
                >
                  <FaTimes />
                </IconButton>
              </HStack>
            </Card.Header>

            <Card.Body>
              <VStack gap={4} align="stretch">
                <Text color="gray.600" fontSize="sm">
                  Mark attendance for students in {classes.find(c => c.id === parseInt(selectedClass))?.name} who haven't been marked yet.
                </Text>

                {getStudentsWithoutAttendance().length === 0 ? (
                  <Text textAlign="center" color="gray.500" py={8}>
                    All students in this class have attendance marked for {selectedDate}.
                  </Text>
                ) : (
                  <VStack gap={3} align="stretch">
                    {getStudentsWithoutAttendance().map((student) => (
                      <Card.Root key={student.id} p={4} bg="gray.50" borderWidth={1}>
                        <HStack justify="space-between">
                          <VStack align="start" gap={1}>
                            <Text fontWeight="medium">{student.name}</Text>
                            <Text fontSize="sm" color="gray.600">Roll: {student.rollNumber}</Text>
                          </VStack>
                          <HStack gap={2}>
                            <select
                              style={{
                                padding: '6px 10px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                fontSize: '13px'
                              }}
                              value={bulkAttendance[student.id]?.status || 'present'}
                              onChange={(e) => setBulkAttendance(prev => ({
                                ...prev,
                                [student.id]: {
                                  ...prev[student.id],
                                  status: e.target.value as 'present' | 'absent' | 'late'
                                }
                              }))}
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="late">Late</option>
                            </select>
                            <Input
                              size="sm"
                              placeholder="Remarks (optional)"
                              value={bulkAttendance[student.id]?.remarks || ''}
                              onChange={(e) => setBulkAttendance(prev => ({
                                ...prev,
                                [student.id]: {
                                  ...prev[student.id],
                                  status: prev[student.id]?.status || 'present',
                                  remarks: e.target.value
                                }
                              }))}
                              maxW="200px"
                            />
                          </HStack>
                        </HStack>
                      </Card.Root>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Card.Body>

            <Card.Footer>
              <HStack gap={3} w="100%" justify="end">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkMarkModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleBulkMarkAttendance}
                  loading={submitting}
                  disabled={getStudentsWithoutAttendance().length === 0}
                >
                  Mark All Attendance
                </Button>
              </HStack>
            </Card.Footer>
          </Card.Root>
        </Box>
      )}
    </Box>
  );
};

export default AttendanceManagement;