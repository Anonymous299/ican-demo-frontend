import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Card,
  Flex,
  Spacer,
  Input,
} from '@chakra-ui/react';
import { FaTimes, FaEye, FaCalendarAlt, FaFilter, FaComments, FaClipboardList, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

interface Activity {
  id: number;
  title: string;
  studentId: number;
  teacherId: number;
  domainId: number;
  competencyId: number;
  learningOutcomes: string;
  rubric: {
    awareness: { stream: string; mountain: string; sky: string };
    sensitivity: { stream: string; mountain: string; sky: string };
    creativity: { stream: string; mountain: string; sky: string };
  };
  createdAt: string;
  domain?: { id: number; name: string; description: string };
  competency?: { id: number; name: string; description: string };
}

interface Feedback {
  id: number;
  studentId: number;
  teacherId: number;
  feedbackType: 'general' | 'parent' | 'student' | 'peer';
  content: string;
  category: string;
  createdAt: string;
}

interface Observation {
  id: number;
  studentId: number;
  teacherId: number;
  content: string;
  domain: string;
  competency: string;
  setting: string;
  duration: string;
  createdAt: string;
}

interface Student {
  id: number;
  name: string;
  age: number;
  classId: number;
}

interface StudentTimelineProps {
  student: Student;
  onClose: () => void;
}

type TimelineItem = (Activity | Feedback | Observation) & {
  type: 'activity' | 'feedback' | 'observation';
};

const StudentTimeline: React.FC<StudentTimelineProps> = ({
  student,
  onClose
}) => {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'activity' | 'feedback' | 'observation'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  useEffect(() => {
    fetchTimelineData();
  }, [student.id]);

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      
      // Fetch activities for student's class (activities are now class-wide)
      const activitiesResponse = await axios.get(`${API_BASE_URL}/api/activities/${student.id}`);
      const activities = activitiesResponse.data.map((item: Activity) => ({
        ...item,
        type: 'activity' as const
      }));

      // Fetch feedback
      const feedbackResponse = await axios.get(`${API_BASE_URL}/api/feedback/${student.id}`);
      const allFeedback = [
        ...feedbackResponse.data.general.map((item: Feedback) => ({ ...item, type: 'feedback' as const })),
        ...feedbackResponse.data.parent.map((item: Feedback) => ({ ...item, type: 'feedback' as const })),
        ...feedbackResponse.data.student.map((item: Feedback) => ({ ...item, type: 'feedback' as const })),
        ...feedbackResponse.data.peer.map((item: Feedback) => ({ ...item, type: 'feedback' as const }))
      ];

      // Fetch observations
      const observationsResponse = await axios.get(`${API_BASE_URL}/api/observations/${student.id}`);
      const observations = observationsResponse.data.map((item: Observation) => ({
        ...item,
        type: 'observation' as const
      }));

      // Combine and sort by date
      const combined = [...activities, ...allFeedback, ...observations];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setTimelineItems(combined);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = timelineItems.filter(item => {
    const matchesFilter = filterType === 'all' || item.type === filterType;
    const matchesSearch = searchTerm === '' || 
      (isActivity(item) && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (isFeedback(item) && item.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (isObservation(item) && item.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'activity': return <FaClipboardList />;
      case 'feedback': return <FaComments />;
      case 'observation': return <FaEye />;
      default: return <FaCalendarAlt />;
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'activity': return 'green';
      case 'feedback': return 'blue';
      case 'observation': return 'teal';
      default: return 'gray';
    }
  };

  const isActivity = (item: TimelineItem): item is Activity & { type: 'activity' } => {
    return item.type === 'activity';
  };

  const isFeedback = (item: TimelineItem): item is Feedback & { type: 'feedback' } => {
    return item.type === 'feedback';
  };

  const isObservation = (item: TimelineItem): item is Observation & { type: 'observation' } => {
    return item.type === 'observation';
  };

  const getItemTitle = (item: TimelineItem) => {
    if (isActivity(item)) {
      return item.title;
    } else if (isFeedback(item)) {
      return `${item.feedbackType.charAt(0).toUpperCase() + item.feedbackType.slice(1)} Feedback`;
    } else if (isObservation(item)) {
      return 'Teacher Observation';
    }
    return 'Timeline Item';
  };

  const getItemPreview = (item: TimelineItem) => {
    if (isActivity(item)) {
      return item.learningOutcomes;
    } else if (isFeedback(item)) {
      return item.content;
    } else if (isObservation(item)) {
      return item.content;
    }
    return '';
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (window.confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/activities/${activityId}`);
        alert('Activity deleted successfully!');
        fetchTimelineData(); // Refresh the timeline
      } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Error deleting activity. You can only delete your own activities.');
      }
    }
  };

  return (
    <Box>
      <Card.Root>
        <Card.Header>
          <Flex align="center">
            <VStack align="start" gap={1}>
              <Heading size="md" color="purple.600">
                Student Timeline
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Activity history and progress for {student.name}
              </Text>
            </VStack>
            <Spacer />
            <Button size="sm" variant="ghost" onClick={onClose}>
              <FaTimes />
            </Button>
          </Flex>
        </Card.Header>

        <Card.Body>
          {/* Filters */}
          <VStack gap={4} align="stretch" mb={6}>
            <HStack gap={4} align="end">
              <Box flex={1}>
                <Text mb={2} fontWeight="medium" fontSize="sm">Search</Text>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search activities, feedback, or observations..."
                  size="sm"
                />
              </Box>
              <Box>
                <Text mb={2} fontWeight="medium" fontSize="sm">Filter by Type</Text>
                <HStack gap={2}>
                  <Button
                    size="xs"
                    variant={filterType === 'all' ? 'solid' : 'outline'}
                    colorScheme="gray"
                    onClick={() => setFilterType('all')}
                  >
                    All ({timelineItems.length})
                  </Button>
                  <Button
                    size="xs"
                    variant={filterType === 'activity' ? 'solid' : 'outline'}
                    colorScheme="green"
                    onClick={() => setFilterType('activity')}
                  >
                    Activities ({timelineItems.filter(i => i.type === 'activity').length})
                  </Button>
                  <Button
                    size="xs"
                    variant={filterType === 'feedback' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    onClick={() => setFilterType('feedback')}
                  >
                    Feedback ({timelineItems.filter(i => i.type === 'feedback').length})
                  </Button>
                  <Button
                    size="xs"
                    variant={filterType === 'observation' ? 'solid' : 'outline'}
                    colorScheme="teal"
                    onClick={() => setFilterType('observation')}
                  >
                    Observations ({timelineItems.filter(i => i.type === 'observation').length})
                  </Button>
                </HStack>
              </Box>
            </HStack>
          </VStack>

          {/* Timeline */}
          {loading ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">Loading timeline...</Text>
            </Box>
          ) : filteredItems.length === 0 ? (
            <Box textAlign="center" py={8} color="gray.500">
              <Text fontSize="lg" mb={2}>No items found</Text>
              <Text fontSize="sm">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No activities, feedback, or observations have been recorded for this student or their class yet'
                }
              </Text>
            </Box>
          ) : (
            <VStack gap={4} align="stretch">
              {filteredItems.map((item, index) => (
                <Box
                  key={`${item.type}-${item.id}`}
                  p={4}
                  bg="white"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  _hover={{ borderColor: `${getItemColor(item.type)}.200`, shadow: 'sm' }}
                  transition="all 0.2s"
                  position="relative"
                >
                  {/* Timeline connector */}
                  {index < filteredItems.length - 1 && (
                    <Box
                      position="absolute"
                      left="20px"
                      top="60px"
                      bottom="-16px"
                      w="2px"
                      bg="gray.200"
                      zIndex={0}
                    />
                  )}

                  <Flex align="start" gap={4}>
                    {/* Timeline Icon */}
                    <Box
                      p={2}
                      bg={`${getItemColor(item.type)}.100`}
                      color={`${getItemColor(item.type)}.600`}
                      borderRadius="full"
                      border="2px solid white"
                      boxShadow="sm"
                      zIndex={1}
                    >
                      {getItemIcon(item.type)}
                    </Box>

                    <Box flex={1}>
                      <HStack mb={2} justify="space-between" align="start">
                        <VStack align="start" gap={1}>
                          <Heading size="sm" color={`${getItemColor(item.type)}.700`}>
                            {getItemTitle(item)}
                          </Heading>
                          <HStack gap={2}>
                            <Badge colorScheme={getItemColor(item.type)} size="sm">
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                            </Badge>
                            {isActivity(item) && (
                              <>
                                <Badge colorScheme="blue" size="sm">
                                  {item.domain?.name || 'Unknown Domain'}
                                </Badge>
                                <Badge colorScheme="purple" size="sm">
                                  {item.competency?.name || 'Unknown Competency'}
                                </Badge>
                              </>
                            )}
                            {isFeedback(item) && (
                              <Badge colorScheme="orange" size="sm">
                                {item.category}
                              </Badge>
                            )}
                            {isObservation(item) && (
                              <Badge colorScheme="cyan" size="sm">
                                {item.setting}
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                        <VStack gap={2}>
                          <Button
                            size="xs"
                            colorScheme={getItemColor(item.type)}
                            variant="outline"
                            onClick={() => setSelectedItem(item)}
                          >
                            <FaEye />
                            View
                          </Button>
                          {isActivity(item) && (
                            <Button
                              size="xs"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleDeleteActivity(item.id)}
                            >
                              <FaTrash />
                              Delete
                            </Button>
                          )}
                        </VStack>
                      </HStack>

                      <Text fontSize="sm" color="gray.600" mb={3} lineClamp={2}>
                        {getItemPreview(item)}
                      </Text>

                      <HStack justify="space-between" align="center">
                        <HStack gap={2} fontSize="xs" color="gray.400">
                          <FaCalendarAlt />
                          <Text>{formatDate(item.createdAt)}</Text>
                        </HStack>
                      </HStack>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </VStack>
          )}
        </Card.Body>
      </Card.Root>

      {/* Detail Modal */}
      {selectedItem && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
          onClick={() => setSelectedItem(null)}
        >
          <Box
            bg="white"
            borderRadius="md"
            maxW="900px"
            maxH="80vh"
            w="90%"
            overflow="hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Box p={6} borderBottom="1px solid" borderColor="gray.200">
              <Flex align="center">
                <VStack align="start" gap={1}>
                  <Heading size="md">{getItemTitle(selectedItem)}</Heading>
                  <HStack gap={2}>
                    <Badge colorScheme={getItemColor(selectedItem.type)}>
                      {selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}
                    </Badge>
                    <Badge colorScheme="gray">
                      {formatDate(selectedItem.createdAt)}
                    </Badge>
                  </HStack>
                </VStack>
                <Spacer />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedItem(null)}
                >
                  <FaTimes />
                </Button>
              </Flex>
            </Box>

            <Box p={6} maxH="60vh" overflow="auto">
              {isActivity(selectedItem) && (
                <VStack gap={4} align="stretch">
                  <Box>
                    <Text fontWeight="medium" mb={2}>Learning Outcomes</Text>
                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="sm">{selectedItem.learningOutcomes}</Text>
                    </Box>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" mb={2}>Domain & Competency</Text>
                    <HStack gap={4}>
                      <Badge colorScheme="blue">{selectedItem.domain?.name}</Badge>
                      <Badge colorScheme="purple">{selectedItem.competency?.name}</Badge>
                    </HStack>
                  </Box>
                </VStack>
              )}

              {isFeedback(selectedItem) && (
                <VStack gap={4} align="stretch">
                  <Box>
                    <Text fontWeight="medium" mb={2}>Feedback Content</Text>
                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="sm">{selectedItem.content}</Text>
                    </Box>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" mb={2}>Details</Text>
                    <HStack gap={4}>
                      <Badge colorScheme="blue">{selectedItem.feedbackType} Feedback</Badge>
                      <Badge colorScheme="orange">{selectedItem.category}</Badge>
                    </HStack>
                  </Box>
                </VStack>
              )}

              {isObservation(selectedItem) && (
                <VStack gap={4} align="stretch">
                  <Box>
                    <Text fontWeight="medium" mb={2}>Observation Notes</Text>
                    <Box bg="gray.50" p={4} borderRadius="md">
                      <Text fontSize="sm">{selectedItem.content}</Text>
                    </Box>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" mb={2}>Observation Details</Text>
                    <VStack align="start" gap={2}>
                      <HStack gap={4}>
                        <Badge colorScheme="teal">Setting: {selectedItem.setting}</Badge>
                        {selectedItem.duration && (
                          <Badge colorScheme="purple">Duration: {selectedItem.duration} min</Badge>
                        )}
                      </HStack>
                      {selectedItem.domain && (
                        <Badge colorScheme="blue">Domain: {selectedItem.domain}</Badge>
                      )}
                      {selectedItem.competency && (
                        <Badge colorScheme="green">Competency: {selectedItem.competency}</Badge>
                      )}
                    </VStack>
                  </Box>
                </VStack>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default StudentTimeline;