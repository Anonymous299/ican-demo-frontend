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
} from '@chakra-ui/react';
import { FaCheck, FaTimes, FaClock, FaSave, FaArrowLeft } from 'react-icons/fa';
import { API_BASE_URL } from '../config/constants';

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  class: string;
}

interface Class {
  id: number;
  name: string;
  grade: string;
  division: string;
}

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

interface QuickAttendanceProps {
  onBack: () => void;
}

type AttendanceStatus = 'present' | 'absent';

const QuickAttendance: React.FC<QuickAttendanceProps> = ({ onBack }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<{[studentId: number]: AttendanceStatus}>({});
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const toaster = createToaster({
    placement: 'top-right',
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchExistingAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to fetch classes',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchStudents = async () => {
    if (!selectedClass) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter students by selected class
      const classStudents = response.data.filter((student: Student) => 
        student.class === selectedClass.name
      );
      setStudents(classStudents);
      
      // Initialize attendance state for all students - default to present
      const initialAttendance: {[studentId: number]: AttendanceStatus} = {};
      classStudents.forEach((student: Student) => {
        initialAttendance[student.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to fetch students',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    if (!selectedClass) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/attendance/class/${selectedClass.id}?date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setExistingAttendance(response.data);
      
      // Update attendance state with existing records
      setAttendance(prevAttendance => {
        const updatedAttendance = { ...prevAttendance };
        response.data.forEach((record: AttendanceRecord) => {
          updatedAttendance[record.studentId] = record.status;
        });
        return updatedAttendance;
      });
    } catch (error) {
      console.error('Error fetching existing attendance:', error);
    }
  };

  const toggleAttendanceStatus = (studentId: number, currentStatus: AttendanceStatus) => {
    const newStatus: AttendanceStatus = currentStatus === 'present' ? 'absent' : 'present';
    
    setAttendance(prev => ({
      ...prev,
      [studentId]: newStatus
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Prepare attendance records for all students (all have status now)
      const attendanceRecords = students
        .map(student => ({
          studentId: student.id,
          classId: selectedClass.id,
          date: selectedDate,
          status: attendance[student.id],
          timeIn: attendance[student.id] === 'absent' ? null : '09:00:00',
          timeOut: attendance[student.id] === 'absent' ? null : '15:30:00',
          remarks: ''
        }));

      if (attendanceRecords.length === 0) {
        toaster.create({
          title: 'No Students',
          description: 'No students found in selected class',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      // Check if we need to update existing records or create new ones
      const existingStudentIds = existingAttendance.map(record => record.studentId);
      const newRecords = attendanceRecords.filter(record => 
        !existingStudentIds.includes(record.studentId)
      );
      const updateRecords = attendanceRecords.filter(record => 
        existingStudentIds.includes(record.studentId)
      );

      // Create new attendance records
      if (newRecords.length > 0) {
        await axios.post(`${API_BASE_URL}/api/attendance/bulk`, {
          attendanceRecords: newRecords
        }, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      // Update existing records
      for (const record of updateRecords) {
        const existingRecord = existingAttendance.find(existing => 
          existing.studentId === record.studentId
        );
        
        if (existingRecord && existingRecord.status !== record.status) {
          await axios.put(`${API_BASE_URL}/api/attendance/${existingRecord.id}`, {
            status: record.status,
            timeIn: record.timeIn,
            timeOut: record.timeOut
          }, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      }

      toaster.create({
        title: 'Success',
        description: `Attendance saved for ${attendanceRecords.length} students`,
        status: 'success',
        duration: 3000,
      });

      // Refresh existing attendance to reflect changes
      await fetchExistingAttendance();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toaster.create({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save attendance',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'green';
      case 'absent': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return <FaCheck />;
      case 'absent': return <FaTimes />;
      default: return <FaCheck />;
    }
  };

  const getStatusText = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      default: return 'Present';
    }
  };

  const getAttendanceSummary = () => {
    const total = students.length;
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;
    
    return { total, present, absent };
  };

  const summary = getAttendanceSummary();

  return (
    <Box>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack>
            <Button
              variant="outline"
              onClick={onBack}
              size="sm"
            >
              <FaArrowLeft />
              Back
            </Button>
            <Heading size="lg" color="blue.700">
              📋 Quick Attendance
            </Heading>
          </HStack>
          <HStack>
            <Text fontSize="sm" color="gray.600">Date:</Text>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </HStack>
        </HStack>

        {/* Class Selection */}
        {!selectedClass && (
          <Card.Root p={6}>
            <Card.Header>
              <Heading size="md" color="blue.600">Select Class</Heading>
            </Card.Header>
            <Card.Body>
              <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} gap={4}>
                {classes.map((cls) => (
                  <Button
                    key={cls.id}
                    size="lg"
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => setSelectedClass(cls)}
                    h="80px"
                    flexDirection="column"
                    gap={2}
                  >
                    <Text fontWeight="bold">{cls.name}</Text>
                    <Text fontSize="xs" color="gray.600">
                      Grade {cls.grade}{cls.division}
                    </Text>
                  </Button>
                ))}
              </SimpleGrid>
            </Card.Body>
          </Card.Root>
        )}

        {/* Attendance Interface */}
        {selectedClass && (
          <>
            {/* Class Info and Summary */}
            <Card.Root p={4} bg="blue.50" borderColor="blue.200" borderWidth={1}>
              <HStack justify="space-between" align="center">
                <VStack align="start" gap={1}>
                  <Heading size="md" color="blue.700">{selectedClass.name}</Heading>
                  <Text fontSize="sm" color="blue.600">
                    {selectedDate} • {students.length} students
                  </Text>
                </VStack>
                
                <HStack gap={8}>
                  <VStack gap={0}>
                    <Text fontSize="xl" fontWeight="bold" color="green.600">{summary.present}</Text>
                    <Text fontSize="sm" color="green.600">Present</Text>
                  </VStack>
                  <VStack gap={0}>
                    <Text fontSize="xl" fontWeight="bold" color="red.600">{summary.absent}</Text>
                    <Text fontSize="sm" color="red.600">Absent</Text>
                  </VStack>
                  <VStack gap={0}>
                    <Text fontSize="lg" fontWeight="bold" color="blue.600">
                      {summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(0) : 0}%
                    </Text>
                    <Text fontSize="sm" color="blue.600">Attendance Rate</Text>
                  </VStack>
                </HStack>

                <VStack gap={2}>
                  <Button
                    colorScheme="green"
                    onClick={handleSaveAttendance}
                    loading={saving}
                    size="sm"
                    disabled={students.length === 0}
                  >
                    <FaSave />
                    Save Attendance
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedClass(null)}
                    size="sm"
                  >
                    Change Class
                  </Button>
                </VStack>
              </HStack>
            </Card.Root>

            {/* Student List */}
            {loading ? (
              <Card.Root p={8} textAlign="center">
                <Text>Loading students...</Text>
              </Card.Root>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} gap={4}>
                {students.map((student) => {
                  const status = attendance[student.id] || 'unmarked';
                  return (
                    <Card.Root 
                      key={student.id}
                      p={4}
                      bg="white"
                      borderWidth={2}
                      borderColor={status === 'unmarked' ? 'gray.200' : `${getStatusColor(status)}.300`}
                      cursor="pointer"
                      onClick={() => toggleAttendanceStatus(student.id, status)}
                      _hover={{ 
                        borderColor: status === 'unmarked' ? 'gray.400' : `${getStatusColor(status)}.500`,
                        transform: 'translateY(-2px)',
                        boxShadow: 'md'
                      }}
                      transition="all 0.2s"
                    >
                      <Card.Body>
                        <VStack gap={3}>
                          <HStack justify="space-between" w="100%">
                            <VStack align="start" gap={1}>
                              <Text fontWeight="bold" fontSize="sm">{student.name}</Text>
                              <Text fontSize="xs" color="gray.600">Roll: {student.rollNumber}</Text>
                            </VStack>
                            <Badge 
                              colorScheme={getStatusColor(status)} 
                              fontSize="xs"
                              display="flex"
                              alignItems="center"
                              gap={1}
                              px={2}
                              py={1}
                            >
                              {getStatusIcon(status)}
                              {getStatusText(status)}
                            </Badge>
                          </HStack>
                          
                          <Text fontSize="xs" color="gray.500" textAlign="center">
                            {status === 'present' ? 'Click if absent' : 'Click to mark present'}
                          </Text>
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  );
                })}
              </SimpleGrid>
            )}

            {/* Instructions */}
            <Card.Root p={4} bg="gray.50">
              <Text fontSize="sm" color="gray.600" textAlign="center">
                💡 <strong>Simple Instructions:</strong> All students start as Present (green). Click any student card to toggle between Present and Absent (red).
                Only click on students who are absent - everyone else stays green. Click "Save Attendance" when done!
              </Text>
            </Card.Root>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default QuickAttendance;