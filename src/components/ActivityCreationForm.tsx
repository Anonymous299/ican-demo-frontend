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

interface Student {
  id: number;
  name: string;
  age: number;
  classId: number;
  dateOfBirth: string;
  parentContact: string;
  notes: string;
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
  student: Student;
  onClose: () => void;
  onSuccess?: () => void;
}

const ActivityCreationForm: React.FC<ActivityCreationFormProps> = ({
  student,
  onClose,
  onSuccess
}) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    domainId: '',
    competencyId: '',
    learningOutcomes: '',
  });
  const [rubric, setRubric] = useState<Rubric>({
    awareness: { stream: '', mountain: '', sky: '' },
    sensitivity: { stream: '', mountain: '', sky: '' },
    creativity: { stream: '', mountain: '', sky: '' }
  });

  useEffect(() => {
    fetchDomains();
    fetchCompetencies();
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
    setShowPreview(true);
  };

  const handleConfirmCreate = async () => {
    setLoading(true);

    try {
      const payload = {
        studentId: student.id,
        title: formData.title,
        domainId: formData.domainId,
        competencyId: formData.competencyId,
        learningOutcomes: formData.learningOutcomes,
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
  const selectedCompetency = competencies.find(c => c.id === parseInt(formData.competencyId));

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
                  <strong>Student:</strong> {student.name} (Age {student.age})
                </Text>
                
                <HStack gap={4}>
                  <Badge colorScheme="blue" size="sm">
                    <strong>Domain:</strong> {selectedDomain?.name}
                  </Badge>
                  <Badge colorScheme="purple" size="sm">
                    <strong>Competency:</strong> {selectedCompetency?.name}
                  </Badge>
                </HStack>
              </VStack>
            </Box>

            {/* Learning Outcomes Preview */}
            <Box>
              <Text mb={3} fontWeight="medium" fontSize="lg">Learning Outcomes</Text>
              <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {formData.learningOutcomes}
                </Text>
              </Box>
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
              For: {student.name} (Age {student.age})
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
                  onChange={(e) => setFormData({ ...formData, domainId: e.target.value })}
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
                <Text mb={2} fontWeight="medium">Select Competency</Text>
                <select
                  value={formData.competencyId}
                  onChange={(e) => setFormData({ ...formData, competencyId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                  }}
                  required
                >
                  <option value="">Choose a competency</option>
                  {competencies.map(competency => (
                    <option key={competency.id} value={competency.id}>
                      {competency.name}
                    </option>
                  ))}
                </select>
                {selectedCompetency && (
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    {selectedCompetency.description}
                  </Text>
                )}
              </Box>
            </HStack>

            {/* Learning Outcomes */}
            <Box>
              <Text mb={2} fontWeight="medium">Learning Outcomes</Text>
              <Textarea
                value={formData.learningOutcomes}
                onChange={(e) => setFormData({ ...formData, learningOutcomes: e.target.value })}
                placeholder="Describe the expected learning outcomes for this activity..."
                rows={4}
                required
              />
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