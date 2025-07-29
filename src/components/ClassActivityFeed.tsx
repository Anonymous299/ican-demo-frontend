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
} from '@chakra-ui/react';
import { FaTimes, FaEye, FaCalendarAlt, FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

interface Activity {
  id: number;
  title: string;
  classId: number;
  teacherId: number;
  domainId: number;
  competencyIds: number[];
  learningOutcomes: string[];
  rubric: {
    awareness: { stream: string; mountain: string; sky: string };
    sensitivity: { stream: string; mountain: string; sky: string };
    creativity: { stream: string; mountain: string; sky: string };
  };
  createdAt: string;
  domain?: { id: number; name: string; description: string };
  competencies?: { id: number; name: string; description: string }[];
}


interface Class {
  id: number;
  name: string;
  description: string;
}

interface ClassActivityFeedProps {
  selectedClass: Class;
  onClose: () => void;
}

const ClassActivityFeed: React.FC<ClassActivityFeedProps> = ({
  selectedClass,
  onClose
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    fetchClassData();
  }, [selectedClass.id]);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      
      // Fetch all activities for this class
      const activitiesResponse = await axios.get(`${API_BASE_URL}/api/activities/class/${selectedClass.id}`);
      const allActivities = activitiesResponse.data;
      
      // Sort by creation date (newest first)
      allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching class activities:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (window.confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/activities/${activityId}`);
        alert('Activity deleted successfully!');
        fetchClassData(); // Refresh the list
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
              <Heading size="md" color="blue.600">
                Class Activity Feed
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Activities from all teachers in {selectedClass.name}
              </Text>
            </VStack>
            <Spacer />
            <Button size="sm" variant="ghost" onClick={onClose}>
              <FaTimes />
            </Button>
          </Flex>
        </Card.Header>

        <Card.Body>
          {loading ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">Loading activities...</Text>
            </Box>
          ) : activities.length === 0 ? (
            <Box textAlign="center" py={8} color="gray.500">
              <Text fontSize="lg" mb={2}>No activities found</Text>
              <Text fontSize="sm">No activities have been created for this class yet</Text>
            </Box>
          ) : (
            <VStack gap={4} align="stretch">
              {activities.map((activity) => (
                <Box
                  key={activity.id}
                  p={4}
                  bg="white"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  _hover={{ borderColor: 'blue.200', shadow: 'sm' }}
                  transition="all 0.2s"
                >
                  <Flex align="start" gap={4}>
                    <Box flex={1}>
                      <HStack mb={2} justify="space-between" align="start">
                        <VStack align="start" gap={1}>
                          <Heading size="sm" color="blue.700">
                            {activity.title}
                          </Heading>
                          <VStack align="start" gap={1}>
                            <Badge colorScheme="blue" size="sm">
                              {activity.domain?.name || 'Unknown Domain'}
                            </Badge>
                            <HStack gap={1} flexWrap="wrap">
                              {activity.competencies && activity.competencies.length > 0 ? (
                                activity.competencies.map(comp => (
                                  <Badge key={comp.id} colorScheme="purple" size="sm">
                                    {comp.name}
                                  </Badge>
                                ))
                              ) : (
                                <Badge colorScheme="gray" size="sm">
                                  No competencies
                                </Badge>
                              )}
                            </HStack>
                          </VStack>
                        </VStack>
                        <VStack gap={2}>
                          <Button
                            size="xs"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => setSelectedActivity(activity)}
                          >
                            <FaEye />
                            View
                          </Button>
                          <Button
                            size="xs"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => handleDeleteActivity(activity.id)}
                          >
                            <FaTrash />
                            Delete
                          </Button>
                        </VStack>
                      </HStack>

                      <Box mb={3}>
                        <Text fontSize="xs" fontWeight="medium" color="gray.700" mb={1}>
                          Learning Outcomes ({activity.learningOutcomes?.length || 0}):
                        </Text>
                        {activity.learningOutcomes && activity.learningOutcomes.length > 0 ? (
                          <Text fontSize="sm" color="gray.600" lineClamp={2}>
                            {activity.learningOutcomes.slice(0, 2).join('; ')}
                            {activity.learningOutcomes.length > 2 && '...'}
                          </Text>
                        ) : (
                          <Text fontSize="sm" color="gray.400" fontStyle="italic">
                            No learning outcomes specified
                          </Text>
                        )}
                      </Box>

                      <HStack justify="space-between" align="center">
                        <HStack gap={2} fontSize="xs" color="gray.400">
                          <FaCalendarAlt />
                          <Text>{formatDate(activity.createdAt)}</Text>
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

      {/* Activity Detail Modal */}
      {selectedActivity && (
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
          onClick={() => setSelectedActivity(null)}
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
                  <Heading size="md">{selectedActivity.title}</Heading>
                  <VStack align="start" gap={2}>
                    <Badge colorScheme="blue">
                      {selectedActivity.domain?.name}
                    </Badge>
                    <HStack gap={1} flexWrap="wrap">
                      {selectedActivity.competencies && selectedActivity.competencies.length > 0 ? (
                        selectedActivity.competencies.map(comp => (
                          <Badge key={comp.id} colorScheme="purple">
                            {comp.name}
                          </Badge>
                        ))
                      ) : (
                        <Badge colorScheme="gray">
                          No competencies specified
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                </VStack>
                <Spacer />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedActivity(null)}
                >
                  <FaTimes />
                </Button>
              </Flex>
            </Box>

            <Box p={6} maxH="60vh" overflow="auto">
              <VStack gap={6} align="stretch">
                {/* Learning Outcomes */}
                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Learning Outcomes ({selectedActivity.learningOutcomes?.length || 0})
                  </Text>
                  <VStack gap={2} align="stretch">
                    {selectedActivity.learningOutcomes && selectedActivity.learningOutcomes.length > 0 ? (
                      selectedActivity.learningOutcomes.map((outcome, index) => (
                        <Box key={index} bg="green.50" p={3} borderRadius="md" border="1px solid" borderColor="green.200">
                          <Text fontSize="sm" color="green.800">
                            {outcome}
                          </Text>
                        </Box>
                      ))
                    ) : (
                      <Box bg="gray.50" p={4} borderRadius="md">
                        <Text fontSize="sm" color="gray.500" textAlign="center" fontStyle="italic">
                          No learning outcomes specified for this activity
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>

                {/* Rubric */}
                <Box>
                  <Text fontWeight="medium" mb={4}>Assessment Rubric</Text>
                  <Box borderRadius="md" border="1px solid" borderColor="gray.200" overflow="hidden">
                    <Box bg="gray.50" p={3} borderBottom="1px solid" borderColor="gray.200">
                      <HStack>
                        <Box w="120px" fontWeight="bold">Dimension</Box>
                        <Box flex={1} fontWeight="bold">Stream</Box>
                        <Box flex={1} fontWeight="bold">Mountain</Box>
                        <Box flex={1} fontWeight="bold">Sky</Box>
                      </HStack>
                    </Box>
                    
                    {/* Awareness */}
                    <Box p={3} borderBottom="1px solid" borderColor="gray.200">
                      <HStack align="start">
                        <Box w="120px" fontWeight="medium" color="blue.700">Awareness</Box>
                        <Box flex={1} fontSize="sm" color="gray.600">
                          {selectedActivity.rubric.awareness.stream || 'Not specified'}
                        </Box>
                        <Box flex={1} fontSize="sm" color="gray.600">
                          {selectedActivity.rubric.awareness.mountain || 'Not specified'}
                        </Box>
                        <Box flex={1} fontSize="sm" color="gray.600">
                          {selectedActivity.rubric.awareness.sky || 'Not specified'}
                        </Box>
                      </HStack>
                    </Box>

                    {/* Sensitivity */}
                    <Box p={3} borderBottom="1px solid" borderColor="gray.200">
                      <HStack align="start">
                        <Box w="120px" fontWeight="medium" color="green.700">Sensitivity</Box>
                        <Box flex={1} fontSize="sm" color="gray.600">
                          {selectedActivity.rubric.sensitivity.stream || 'Not specified'}
                        </Box>
                        <Box flex={1} fontSize="sm" color="gray.600">
                          {selectedActivity.rubric.sensitivity.mountain || 'Not specified'}
                        </Box>
                        <Box flex={1} fontSize="sm" color="gray.600">
                          {selectedActivity.rubric.sensitivity.sky || 'Not specified'}
                        </Box>
                      </HStack>
                    </Box>

                    {/* Creativity */}
                    <Box p={3}>
                      <HStack align="start">
                        <Box w="120px" fontWeight="medium" color="purple.700">Creativity</Box>
                        <Box flex={1} fontSize="sm" color="gray.600">
                          {selectedActivity.rubric.creativity.stream || 'Not specified'}
                        </Box>
                        <Box flex={1} fontSize="sm" color="gray.600">
                          {selectedActivity.rubric.creativity.mountain || 'Not specified'}
                        </Box>
                        <Box flex={1} fontSize="sm" color="gray.600">
                          {selectedActivity.rubric.creativity.sky || 'Not specified'}
                        </Box>
                      </HStack>
                    </Box>
                  </Box>
                </Box>

                {/* Creation Info */}
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Created on {formatDate(selectedActivity.createdAt)}
                  </Text>
                </Box>
              </VStack>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ClassActivityFeed;