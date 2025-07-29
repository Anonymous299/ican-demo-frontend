import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Input,
  VStack,
  HStack,
  Text,
  Textarea,
  Flex,
  Spacer,
  Card,
  Table,
  Badge,
} from '@chakra-ui/react';
import { FaTimes, FaSave } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

interface Domain {
  id: number;
  name: string;
  description: string;
}

interface Competency {
  id: number;
  name: string;
  description: string;
}

interface LearningOutcome {
  id: number;
  domain: string;
  outcomes: string[];
}

interface Class {
  id: number;
  name: string;
  description: string;
  teacherId: number;
  capacity: number;
  currentEnrollment: number;
}

interface RubricCell {
  stream: string;
  mountain: string;
  sky: string;
}

interface Rubric {
  awareness: RubricCell;
  sensitivity: RubricCell;
  creativity: RubricCell;
}

interface ActivityCreationFormProps {
  selectedClass: Class;
  onClose: () => void;
  onSuccess?: () => void;
}

const ActivityCreationForm: React.FC<ActivityCreationFormProps> = ({
  selectedClass,
  onClose,
  onSuccess
}) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    domainId: '',
    competencyIds: [] as string[],
    selectedLearningOutcomes: [] as string[],
  });
  const [rubric, setRubric] = useState<Rubric>({
    awareness: { stream: '', mountain: '', sky: '' },
    sensitivity: { stream: '', mountain: '', sky: '' },
    creativity: { stream: '', mountain: '', sky: '' }
  });

  useEffect(() => {
    fetchDomains();
    fetchCompetencies();
    fetchLearningOutcomes();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/domains`);
      setDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const fetchCompetencies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/activity-competencies`);
      setCompetencies(response.data);
    } catch (error) {
      console.error('Error fetching competencies:', error);
    }
  };

  const fetchLearningOutcomes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/learning-outcomes`);
      setLearningOutcomes(response.data);
    } catch (error) {
      console.error('Error fetching learning outcomes:', error);
    }
  };

  const handleRubricChange = (
    dimension: keyof Rubric,
    level: keyof RubricCell,
    value: string
  ) => {
    setRubric(prev => ({
      ...prev,
      [dimension]: {
        ...prev[dimension],
        [level]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.competencyIds.length === 0) {
      alert('Please select at least one competency for this activity.');
      return;
    }
    
    if (formData.selectedLearningOutcomes.length === 0) {
      alert('Please select at least one learning outcome for this activity.');
      return;
    }
    
    setShowPreview(true);
  };

  const handleConfirmCreate = async () => {
    setLoading(true);

    try {
      const payload = {
        classId: selectedClass.id,
        title: formData.title,
        domainId: formData.domainId,
        competencyIds: formData.competencyIds.map(id => parseInt(id)),
        learningOutcomes: formData.selectedLearningOutcomes,
        rubric
      };

      await axios.post(`${API_BASE_URL}/api/activities`, payload);
      alert('Activity created successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating activity:', error);
      alert('Error creating activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  const selectedDomain = domains.find(d => d.id === parseInt(formData.domainId));
  const selectedCompetencies = competencies.filter(c => 
    formData.competencyIds.includes(c.id.toString())
  );
  
  // Filter learning outcomes based on selected domain
  const availableOutcomes = selectedDomain 
    ? learningOutcomes.find(lo => lo.domain === selectedDomain.name)?.outcomes || []
    : [];

  // Preview Component
  if (showPreview) {
    return (
      <Card.Root>
        <Card.Header>
          <Flex align="center">
            <VStack align="start" gap={1}>
              <Heading size="md" color="green.600">
                Activity Preview
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Review your activity before creating
              </Text>
            </VStack>
            <Spacer />
            <Button size="sm" variant="ghost" onClick={onClose}>
              <FaTimes />
            </Button>
          </Flex>
        </Card.Header>

        <Card.Body>
          <VStack gap={6} align="stretch">
            {/* Activity Overview */}
            <Box p={4} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
              <VStack align="start" gap={3}>
                <HStack justify="space-between" w="100%">
                  <Heading size="lg" color="green.700">{formData.title}</Heading>
                  <Badge colorScheme="green" size="lg">Ready to Create</Badge>
                </HStack>
                
                <Text fontSize="sm" color="gray.600">
                  <strong>Class:</strong> {selectedClass.name} ({selectedClass.currentEnrollment} students)
                </Text>
                
                <VStack align="start" gap={2}>
                  <Badge colorScheme="blue" size="sm">
                    <strong>Domain:</strong> {selectedDomain?.name}
                  </Badge>
                  {selectedCompetencies.length > 0 && (
                    <Box>
                      <Text fontSize="xs" fontWeight="medium" mb={1}>
                        Competencies ({selectedCompetencies.length}):
                      </Text>
                      <HStack gap={1} flexWrap="wrap">
                        {selectedCompetencies.map(comp => (
                          <Badge key={comp.id} colorScheme="purple" size="sm">
                            {comp.name}
                          </Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}
                </VStack>
              </VStack>
            </Box>

            {/* Learning Outcomes Preview */}
            <Box>
              <Text mb={3} fontWeight="medium" fontSize="lg">
                Learning Outcomes ({formData.selectedLearningOutcomes.length})
              </Text>
              <VStack gap={2} align="stretch">
                {formData.selectedLearningOutcomes.map((outcome, index) => (
                  <Box key={index} bg="green.50" p={3} borderRadius="md" border="1px solid" borderColor="green.200">
                    <Text fontSize="sm" color="green.800">
                      {outcome}
                    </Text>
                  </Box>
                ))}
                {formData.selectedLearningOutcomes.length === 0 && (
                  <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      No learning outcomes selected
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Rubric Preview */}
            <Box>
              <Text mb={4} fontWeight="medium" fontSize="lg">Assessment Rubric</Text>
              <Box borderRadius="md" border="1px solid" borderColor="gray.200" overflow="hidden">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row bg="gray.50">
                      <Table.ColumnHeader fontWeight="bold" w="120px">Dimension</Table.ColumnHeader>
                      <Table.ColumnHeader fontWeight="bold">Stream</Table.ColumnHeader>
                      <Table.ColumnHeader fontWeight="bold">Mountain</Table.ColumnHeader>
                      <Table.ColumnHeader fontWeight="bold">Sky</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell fontWeight="medium" bg="blue.50" color="blue.700">
                        Awareness
                      </Table.Cell>
                      <Table.Cell fontSize="sm" color="gray.700">
                        {rubric.awareness.stream || <Text color="gray.400">Not specified</Text>}
                      </Table.Cell>
                      <Table.Cell fontSize="sm" color="gray.700">
                        {rubric.awareness.mountain || <Text color="gray.400">Not specified</Text>}
                      </Table.Cell>
                      <Table.Cell fontSize="sm" color="gray.700">
                        {rubric.awareness.sky || <Text color="gray.400">Not specified</Text>}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell fontWeight="medium" bg="green.50" color="green.700">
                        Sensitivity
                      </Table.Cell>
                      <Table.Cell fontSize="sm" color="gray.700">
                        {rubric.sensitivity.stream || <Text color="gray.400">Not specified</Text>}
                      </Table.Cell>
                      <Table.Cell fontSize="sm" color="gray.700">
                        {rubric.sensitivity.mountain || <Text color="gray.400">Not specified</Text>}
                      </Table.Cell>
                      <Table.Cell fontSize="sm" color="gray.700">
                        {rubric.sensitivity.sky || <Text color="gray.400">Not specified</Text>}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell fontWeight="medium" bg="purple.50" color="purple.700">
                        Creativity
                      </Table.Cell>
                      <Table.Cell fontSize="sm" color="gray.700">
                        {rubric.creativity.stream || <Text color="gray.400">Not specified</Text>}
                      </Table.Cell>
                      <Table.Cell fontSize="sm" color="gray.700">
                        {rubric.creativity.mountain || <Text color="gray.400">Not specified</Text>}
                      </Table.Cell>
                      <Table.Cell fontSize="sm" color="gray.700">
                        {rubric.creativity.sky || <Text color="gray.400">Not specified</Text>}
                      </Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
              </Box>
            </Box>

            {/* Action Buttons */}
            <HStack justify="space-between" pt={4}>
              <Button variant="outline" onClick={handleBackToEdit} size="md">
                Back to Edit
              </Button>
              <HStack gap={3}>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleConfirmCreate}
                  loading={loading}
                  size="md"
                >
                  <FaSave />
                  Create Activity
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Card.Root>
      <Card.Header>
        <Flex align="center">
          <VStack align="start" gap={1}>
            <Heading size="md" color="green.600">
              Create New Activity
            </Heading>
            <Text fontSize="sm" color="gray.600">
              For: {selectedClass.name} ({selectedClass.currentEnrollment} students)
            </Text>
          </VStack>
          <Spacer />
          <Button size="sm" variant="ghost" onClick={onClose}>
            <FaTimes />
          </Button>
        </Flex>
      </Card.Header>

      <Card.Body>
        <form onSubmit={handleSubmit}>
          <VStack gap={6} align="stretch">
            {/* Activity Title */}
            <Box>
              <Text mb={2} fontWeight="medium">Activity Title</Text>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter activity title..."
                required
              />
            </Box>

            {/* Domain and Competency Selection */}
            <HStack gap={4} align="start">
              <Box flex={1}>
                <Text mb={2} fontWeight="medium">Select Domain</Text>
                <select
                  value={formData.domainId}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    domainId: e.target.value,
                    selectedLearningOutcomes: [], // Clear learning outcomes when domain changes
                    competencyIds: [] // Clear competencies when domain changes
                  })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                  }}
                  required
                >
                  <option value="">Choose a domain</option>
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name}
                    </option>
                  ))}
                </select>
                {selectedDomain && (
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    {selectedDomain.description}
                  </Text>
                )}
              </Box>

              <Box flex={1}>
                <Text mb={2} fontWeight="medium">Select Competencies</Text>
                <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={3} bg="gray.50">
                  <VStack gap={2} align="stretch">
                    {competencies.map(competency => (
                      <Box
                        key={competency.id}
                        p={2}
                        bg="white"
                        borderRadius="md"
                        border="1px solid"
                        borderColor={formData.competencyIds.includes(competency.id.toString()) ? 'blue.300' : 'gray.200'}
                        _hover={{ borderColor: 'blue.200' }}
                        cursor="pointer"
                        onClick={() => {
                          const competencyId = competency.id.toString();
                          const isSelected = formData.competencyIds.includes(competencyId);
                          setFormData({
                            ...formData,
                            competencyIds: isSelected 
                              ? formData.competencyIds.filter(id => id !== competencyId)
                              : [...formData.competencyIds, competencyId]
                          });
                        }}
                      >
                        <HStack>
                          <input
                            type="checkbox"
                            checked={formData.competencyIds.includes(competency.id.toString())}
                            onChange={() => {}} // Handled by onClick above
                            style={{ marginRight: '8px' }}
                          />
                          <VStack align="start" gap={1} flex={1}>
                            <Text fontSize="sm" fontWeight="medium">
                              {competency.name}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {competency.description}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                  {formData.competencyIds.length === 0 && (
                    <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
                      Select one or more competencies for this activity
                    </Text>
                  )}
                </Box>
                {selectedCompetencies.length > 0 && (
                  <Box mt={2}>
                    <Text fontSize="sm" fontWeight="medium" color="blue.700" mb={1}>
                      Selected ({selectedCompetencies.length}):
                    </Text>
                    <HStack gap={1} flexWrap="wrap">
                      {selectedCompetencies.map(comp => (
                        <Badge key={comp.id} colorScheme="blue" size="sm">
                          {comp.name}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                )}
              </Box>
            </HStack>

            {/* Learning Outcomes */}
            <Box>
              <Text mb={2} fontWeight="medium">Learning Outcomes</Text>
              {!selectedDomain ? (
                <Box p={4} bg="orange.50" borderRadius="md" border="1px solid" borderColor="orange.200">
                  <Text fontSize="sm" color="orange.600" textAlign="center">
                    Please select a domain first to see available learning outcomes
                  </Text>
                </Box>
              ) : availableOutcomes.length === 0 ? (
                <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    No learning outcomes available for {selectedDomain.name}
                  </Text>
                </Box>
              ) : (
                <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={3} bg="gray.50">
                  <VStack gap={2} align="stretch">
                    {availableOutcomes.map((outcome, index) => (
                      <Box
                        key={index}
                        p={3}
                        bg="white"
                        borderRadius="md"
                        border="1px solid"
                        borderColor={formData.selectedLearningOutcomes.includes(outcome) ? 'green.300' : 'gray.200'}
                        _hover={{ borderColor: 'green.200' }}
                        cursor="pointer"
                        onClick={() => {
                          const isSelected = formData.selectedLearningOutcomes.includes(outcome);
                          setFormData({
                            ...formData,
                            selectedLearningOutcomes: isSelected 
                              ? formData.selectedLearningOutcomes.filter(lo => lo !== outcome)
                              : [...formData.selectedLearningOutcomes, outcome]
                          });
                        }}
                      >
                        <HStack align="start">
                          <input
                            type="checkbox"
                            checked={formData.selectedLearningOutcomes.includes(outcome)}
                            onChange={() => {}} // Handled by onClick above
                            style={{ marginTop: '2px', marginRight: '8px' }}
                          />
                          <Text fontSize="sm" flex={1}>
                            {outcome}
                          </Text>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                  {formData.selectedLearningOutcomes.length === 0 && (
                    <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
                      Select one or more learning outcomes for this activity
                    </Text>
                  )}
                </Box>
              )}
              
              {formData.selectedLearningOutcomes.length > 0 && (
                <Box mt={2}>
                  <Text fontSize="sm" fontWeight="medium" color="green.700" mb={2}>
                    Selected Learning Outcomes ({formData.selectedLearningOutcomes.length}):
                  </Text>
                  <VStack gap={2} align="stretch">
                    {formData.selectedLearningOutcomes.map((outcome, index) => (
                      <Box key={index} p={2} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                        <Text fontSize="sm" color="green.800">
                          {outcome}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
            </Box>

            {/* Rubric Section */}
            <Box>
              <Text mb={4} fontWeight="medium" fontSize="lg">Assessment Rubric</Text>
              <Box borderRadius="md" border="1px solid" borderColor="gray.200" overflow="hidden">
                <Table.Root>
                  <Table.Header>
                    <Table.Row bg="gray.50">
                      <Table.ColumnHeader fontWeight="bold" w="150px">Dimension</Table.ColumnHeader>
                      <Table.ColumnHeader fontWeight="bold">Stream</Table.ColumnHeader>
                      <Table.ColumnHeader fontWeight="bold">Mountain</Table.ColumnHeader>
                      <Table.ColumnHeader fontWeight="bold">Sky</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {/* Awareness Row */}
                    <Table.Row>
                      <Table.Cell fontWeight="medium" bg="blue.50" color="blue.700">
                        Awareness
                      </Table.Cell>
                      <Table.Cell p={2}>
                        <Textarea
                          value={rubric.awareness.stream}
                          onChange={(e) => handleRubricChange('awareness', 'stream', e.target.value)}
                          placeholder="Awareness at Stream level..."
                          size="sm"
                          rows={2}
                        />
                      </Table.Cell>
                      <Table.Cell p={2}>
                        <Textarea
                          value={rubric.awareness.mountain}
                          onChange={(e) => handleRubricChange('awareness', 'mountain', e.target.value)}
                          placeholder="Awareness at Mountain level..."
                          size="sm"
                          rows={2}
                        />
                      </Table.Cell>
                      <Table.Cell p={2}>
                        <Textarea
                          value={rubric.awareness.sky}
                          onChange={(e) => handleRubricChange('awareness', 'sky', e.target.value)}
                          placeholder="Awareness at Sky level..."
                          size="sm"
                          rows={2}
                        />
                      </Table.Cell>
                    </Table.Row>

                    {/* Sensitivity Row */}
                    <Table.Row>
                      <Table.Cell fontWeight="medium" bg="green.50" color="green.700">
                        Sensitivity
                      </Table.Cell>
                      <Table.Cell p={2}>
                        <Textarea
                          value={rubric.sensitivity.stream}
                          onChange={(e) => handleRubricChange('sensitivity', 'stream', e.target.value)}
                          placeholder="Sensitivity at Stream level..."
                          size="sm"
                          rows={2}
                        />
                      </Table.Cell>
                      <Table.Cell p={2}>
                        <Textarea
                          value={rubric.sensitivity.mountain}
                          onChange={(e) => handleRubricChange('sensitivity', 'mountain', e.target.value)}
                          placeholder="Sensitivity at Mountain level..."
                          size="sm"
                          rows={2}
                        />
                      </Table.Cell>
                      <Table.Cell p={2}>
                        <Textarea
                          value={rubric.sensitivity.sky}
                          onChange={(e) => handleRubricChange('sensitivity', 'sky', e.target.value)}
                          placeholder="Sensitivity at Sky level..."
                          size="sm"
                          rows={2}
                        />
                      </Table.Cell>
                    </Table.Row>

                    {/* Creativity Row */}
                    <Table.Row>
                      <Table.Cell fontWeight="medium" bg="purple.50" color="purple.700">
                        Creativity
                      </Table.Cell>
                      <Table.Cell p={2}>
                        <Textarea
                          value={rubric.creativity.stream}
                          onChange={(e) => handleRubricChange('creativity', 'stream', e.target.value)}
                          placeholder="Creativity at Stream level..."
                          size="sm"
                          rows={2}
                        />
                      </Table.Cell>
                      <Table.Cell p={2}>
                        <Textarea
                          value={rubric.creativity.mountain}
                          onChange={(e) => handleRubricChange('creativity', 'mountain', e.target.value)}
                          placeholder="Creativity at Mountain level..."
                          size="sm"
                          rows={2}
                        />
                      </Table.Cell>
                      <Table.Cell p={2}>
                        <Textarea
                          value={rubric.creativity.sky}
                          onChange={(e) => handleRubricChange('creativity', 'sky', e.target.value)}
                          placeholder="Creativity at Sky level..."
                          size="sm"
                          rows={2}
                        />
                      </Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
              </Box>
              <Text fontSize="sm" color="gray.600" mt={2}>
                Fill out the rubric to define assessment criteria at different levels of achievement.
              </Text>
            </Box>

            {/* Submit Buttons */}
            <HStack justify="flex-end" gap={3} pt={4}>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="green"
                loading={loading}
              >
                <FaSave />
                Preview Activity
              </Button>
            </HStack>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  );
};

export default ActivityCreationForm;