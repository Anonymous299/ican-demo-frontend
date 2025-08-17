import React, { useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  Button,
  HStack,
} from '@chakra-ui/react';
import { FaUsers, FaCogs, FaFileAlt, FaArrowLeft, FaGraduationCap, FaSchool, FaBook, FaClipboardList, FaQuestionCircle } from 'react-icons/fa';
import TeacherManagement from './TeacherManagement';
import CompetencyManagement from './CompetencyManagement';
import TemplateManagement from './TemplateManagement';
import StudentManagement from './StudentManagement';
import ClassManagement from './ClassManagement';
import LessonPlanManagement from './LessonPlanManagement';
import QuickAttendance from './QuickAttendance';
import TestManagement from './TestManagement';

type AdminView = 'dashboard' | 'teachers' | 'competencies' | 'templates' | 'students' | 'classes' | 'curriculum' | 'attendance' | 'tests';

const AdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'teachers':
        return <TeacherManagement />;
      case 'competencies':
        return <CompetencyManagement />;
      case 'templates':
        return <TemplateManagement />;
      case 'students':
        return <StudentManagement />;
      case 'classes':
        return <ClassManagement />;
      case 'curriculum':
        return <LessonPlanManagement />;
      case 'attendance':
        return <QuickAttendance onBack={() => setCurrentView('dashboard')} />;
      case 'tests':
        return <TestManagement />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      <Heading mb={6} color="blue.600">
        Admin Dashboard
      </Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm" 
          textAlign="center" 
          cursor="pointer"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
          transition="all 0.2s"
          onClick={() => setCurrentView('teachers')}
        >
          <Box mb={4} display="flex" justifyContent="center">
            <FaUsers size={48} color="#3182ce" />
          </Box>
          <Heading size="md" mb={2}>Teacher Management</Heading>
          <Text color="gray.600">
            Add, edit, assign teachers to classes and subjects
          </Text>
        </Box>

        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm" 
          textAlign="center" 
          cursor="pointer"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
          transition="all 0.2s"
          onClick={() => setCurrentView('competencies')}
        >
          <Box mb={4} display="flex" justifyContent="center">
            <FaCogs size={48} color="#38a169" />
          </Box>
          <Heading size="md" mb={2}>Competency Management</Heading>
          <Text color="gray.600">
            Manage child development domains and competencies
          </Text>
        </Box>

        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm" 
          textAlign="center" 
          cursor="pointer"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
          transition="all 0.2s"
          onClick={() => setCurrentView('templates')}
        >
          <Box mb={4} display="flex" justifyContent="center">
            <FaFileAlt size={48} color="#805ad5" />
          </Box>
          <Heading size="md" mb={2}>Template Management</Heading>
          <Text color="gray.600">
            View and edit teacher, parent, and student templates
          </Text>
        </Box>

        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm" 
          textAlign="center" 
          cursor="pointer"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
          transition="all 0.2s"
          onClick={() => setCurrentView('students')}
        >
          <Box mb={4} display="flex" justifyContent="center">
            <FaGraduationCap size={48} color="#e53e3e" />
          </Box>
          <Heading size="md" mb={2}>Student Management</Heading>
          <Text color="gray.600">
            Add students manually or upload from Excel files
          </Text>
        </Box>

        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm" 
          textAlign="center" 
          cursor="pointer"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
          transition="all 0.2s"
          onClick={() => setCurrentView('classes')}
        >
          <Box mb={4} display="flex" justifyContent="center">
            <FaSchool size={48} color="#f6ad55" />
          </Box>
          <Heading size="md" mb={2}>Class Management</Heading>
          <Text color="gray.600">
            Create and manage classes, assign teachers, track enrollment
          </Text>
        </Box>

        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm" 
          textAlign="center" 
          cursor="pointer"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
          transition="all 0.2s"
          onClick={() => setCurrentView('curriculum')}
        >
          <Box mb={4} display="flex" justifyContent="center">
            <FaBook size={48} color="#9f7aea" />
          </Box>
          <Heading size="md" mb={2}>Curriculum Planning</Heading>
          <Text color="gray.600">
            Design curriculum plans, manage units, objectives and assessments
          </Text>
        </Box>

        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm" 
          textAlign="center" 
          cursor="pointer"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
          transition="all 0.2s"
          onClick={() => setCurrentView('attendance')}
        >
          <Box mb={4} display="flex" justifyContent="center">
            <FaClipboardList size={48} color="#4299e1" />
          </Box>
          <Heading size="md" mb={2}>Attendance Management</Heading>
          <Text color="gray.600">
            Track student attendance, mark daily records and generate reports
          </Text>
        </Box>

        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm" 
          textAlign="center" 
          cursor="pointer"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
          transition="all 0.2s"
          onClick={() => setCurrentView('tests')}
        >
          <Box mb={4} display="flex" justifyContent="center">
            <FaQuestionCircle size={48} color="#ed8936" />
          </Box>
          <Heading size="md" mb={2}>Test Management</Heading>
          <Text color="gray.600">
            Create and manage quizzes, tests, and assessments for students
          </Text>
        </Box>
      </SimpleGrid>
    </>
  );

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
      
      {renderCurrentView()}
    </Box>
  );
};

export default AdminDashboard;