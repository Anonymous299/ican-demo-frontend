import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Input,
  VStack,
  HStack,
  Text,
  Badge,
  Textarea,
  Flex,
  Spacer,
  Card,
  SimpleGrid,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

interface Competency {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}

interface CurricularGoal {
  id: number;
  title: string;
  description: string;
  competencies: Competency[];
  createdAt: string;
  updatedAt?: string;
}

interface CurricularGoalsData {
  'physical': CurricularGoal[];
  'cognitive': CurricularGoal[];
  'language': CurricularGoal[];
  'socio-emotional': CurricularGoal[];
  'moral': CurricularGoal[];
}

const CompetencyManagement: React.FC = () => {
  const [curricularGoals, setCurricularGoals] = useState<CurricularGoalsData>({
    'physical': [],
    'cognitive': [],
    'language': [],
    'socio-emotional': [],
    'moral': []
  });
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<{goal: CurricularGoal, domain: string} | null>(null);
  const [showAddCompetencyForm, setShowAddCompetencyForm] = useState<string | null>(null);
  const [editingCompetency, setEditingCompetency] = useState<{competency: Competency, domain: string, goalId: number} | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [competencyFormData, setCompetencyFormData] = useState({
    title: '',
    description: '',
  });

  const domainInfo = {
    'physical': {
      title: 'Physical Development',
      color: 'green',
      description: 'Motor skills, coordination, health, and physical well-being'
    },
    'cognitive': {
      title: 'Cognitive Development',
      color: 'blue',
      description: 'Thinking, reasoning, problem-solving, and intellectual growth'
    },
    'language': {
      title: 'Language Development',
      color: 'purple',
      description: 'Communication, vocabulary, literacy, and expression skills'
    },
    'socio-emotional': {
      title: 'Socio-Emotional Development',
      color: 'orange',
      description: 'Social skills, emotional regulation, and relationship building'
    },
    'moral': {
      title: 'Moral Development',
      color: 'teal',
      description: 'Values, ethics, character building, and moral reasoning'
    }
  };

  useEffect(() => {
    fetchCurricularGoals();
  }, []);

  const fetchCurricularGoals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/competencies`);
      setCurricularGoals(response.data);
    } catch (error) {
      console.error('Error fetching curricular goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (domain: string) => {
    try {
      if (editingGoal) {
        await axios.put(`${API_BASE_URL}/api/competencies/${domain}/${editingGoal.goal.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/competencies/${domain}`, formData);
      }

      fetchCurricularGoals();
      resetForm();
    } catch (error) {
      console.error('Error saving curricular goal:', error);
    }
  };

  const handleDeleteGoal = async (domain: string, id: number) => {
    if (window.confirm('Are you sure you want to delete this curricular goal?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/competencies/${domain}/${id}`);
        fetchCurricularGoals();
      } catch (error) {
        console.error('Error deleting curricular goal:', error);
      }
    }
  };

  const handleEditGoal = (goal: CurricularGoal, domain: string) => {
    setEditingGoal({ goal, domain });
    setFormData({
      title: goal.title,
      description: goal.description,
    });
    setShowAddForm(domain);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
    });
    setEditingGoal(null);
    setShowAddForm(null);
  };

  const resetCompetencyForm = () => {
    setCompetencyFormData({
      title: '',
      description: '',
    });
    setEditingCompetency(null);
    setShowAddCompetencyForm(null);
  };

  const handleAddCompetency = async (domain: string, goalId: number) => {
    try {
      if (editingCompetency) {
        await axios.put(`${API_BASE_URL}/api/competencies/${domain}/${goalId}/competencies/${editingCompetency.competency.id}`, competencyFormData);
      } else {
        await axios.post(`${API_BASE_URL}/api/competencies/${domain}/${goalId}/competencies`, competencyFormData);
      }

      fetchCurricularGoals();
      resetCompetencyForm();
    } catch (error) {
      console.error('Error saving competency:', error);
    }
  };

  const handleDeleteCompetency = async (domain: string, goalId: number, competencyId: number) => {
    if (window.confirm('Are you sure you want to delete this competency?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/competencies/${domain}/${goalId}/competencies/${competencyId}`);
        fetchCurricularGoals();
      } catch (error) {
        console.error('Error deleting competency:', error);
      }
    }
  };

  const handleEditCompetency = (competency: Competency, domain: string, goalId: number) => {
    setEditingCompetency({ competency, domain, goalId });
    setCompetencyFormData({
      title: competency.title,
      description: competency.description,
    });
    setShowAddCompetencyForm(`${domain}-${goalId}`);
  };

  const toggleGoalExpansion = (goalKey: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalKey)) {
      newExpanded.delete(goalKey);
    } else {
      newExpanded.add(goalKey);
    }
    setExpandedGoals(newExpanded);
  };

  const renderDomainSection = (domain: keyof CurricularGoalsData) => {
    const info = domainInfo[domain];
    const domainGoals = curricularGoals[domain] || [];

    return (
      <Card.Root key={domain}>
        <Card.Header>
          <Flex align="center">
            <VStack align="start" gap={1}>
              <Heading size="md" color={`${info.color}.600`}>
                {info.title}
              </Heading>
              <Text fontSize="sm" color="gray.600">
                {info.description}
              </Text>
            </VStack>
            <Spacer />
            <Button
              size="sm"
              colorScheme={info.color}
              onClick={() => {
                resetForm();
                setShowAddForm(domain);
              }}
            >
              <FaPlus />
              Add Curricular Goal
            </Button>
          </Flex>
        </Card.Header>

        <Card.Body>
          {/* Add Form */}
          {showAddForm === domain && (
            <Box mb={4} p={4} bg="gray.50" borderRadius="md">
              <VStack gap={3}>
                <Flex align="center" w="100%">
                  <Heading size="sm">
                    {editingGoal ? 'Edit Curricular Goal' : 'Add New Curricular Goal'}
                  </Heading>
                  <Spacer />
                  <Button size="xs" variant="ghost" onClick={resetForm}>
                    <FaTimes />
                  </Button>
                </Flex>

                <Box w="100%">
                  <Text mb={2} fontWeight="medium" fontSize="sm">Title</Text>
                  <Input
                    size="sm"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Curricular goal title"
                  />
                </Box>

                <Box w="100%">
                  <Text mb={2} fontWeight="medium" fontSize="sm">Description</Text>
                  <Textarea
                    size="sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of the curricular goal"
                    rows={3}
                  />
                </Box>

                <HStack w="100%" justify="flex-end" gap={2}>
                  <Button size="sm" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    colorScheme={info.color}
                    onClick={() => handleAddGoal(domain)}
                    loading={loading}
                  >
                    {editingGoal ? 'Update' : 'Add'} Curricular Goal
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )}

          {/* Curricular Goals List */}
          <VStack gap={4} align="stretch">
            {domainGoals.map((goal) => {
              const goalKey = `${domain}-${goal.id}`;
              const isExpanded = expandedGoals.has(goalKey);
              
              return (
                <Box
                  key={goal.id}
                  p={4}
                  bg="white"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  _hover={{ borderColor: `${info.color}.200`, shadow: 'sm' }}
                  transition="all 0.2s"
                >
                  <Flex align="start" mb={3}>
                    <Box flex={1}>
                      <HStack mb={2}>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => toggleGoalExpansion(goalKey)}
                          p={1}
                        >
                          {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                        </Button>
                        <Heading size="sm" color={`${info.color}.700`}>
                          {goal.title}
                        </Heading>
                        <Badge colorScheme={info.color} size="sm">
                          {goal.competencies?.length || 0} competencies
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        {goal.description}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        Created: {new Date(goal.createdAt).toLocaleDateString()}
                        {goal.updatedAt && (
                          <> • Updated: {new Date(goal.updatedAt).toLocaleDateString()}</>
                        )}
                      </Text>
                    </Box>
                    <HStack gap={2}>
                      <Button
                        size="xs"
                        colorScheme={info.color}
                        variant="outline"
                        onClick={() => {
                          resetCompetencyForm();
                          setShowAddCompetencyForm(goalKey);
                        }}
                      >
                        <FaPlus />
                        Add Competency
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="yellow"
                        variant="outline"
                        onClick={() => handleEditGoal(goal, domain)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => handleDeleteGoal(domain, goal.id)}
                      >
                        <FaTrash />
                      </Button>
                    </HStack>
                  </Flex>
                  
                  {/* Add Competency Form */}
                  {showAddCompetencyForm === goalKey && (
                    <Box mb={4} p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                      <VStack gap={3}>
                        <Flex align="center" w="100%">
                          <Heading size="sm">
                            {editingCompetency ? 'Edit Competency' : 'Add New Competency'}
                          </Heading>
                          <Spacer />
                          <Button size="xs" variant="ghost" onClick={resetCompetencyForm}>
                            <FaTimes />
                          </Button>
                        </Flex>

                        <Box w="100%">
                          <Text mb={2} fontWeight="medium" fontSize="sm">Title</Text>
                          <Input
                            size="sm"
                            value={competencyFormData.title}
                            onChange={(e) => setCompetencyFormData({ ...competencyFormData, title: e.target.value })}
                            placeholder="Competency title"
                          />
                        </Box>

                        <Box w="100%">
                          <Text mb={2} fontWeight="medium" fontSize="sm">Description</Text>
                          <Textarea
                            size="sm"
                            value={competencyFormData.description}
                            onChange={(e) => setCompetencyFormData({ ...competencyFormData, description: e.target.value })}
                            placeholder="Detailed description of the competency"
                            rows={3}
                          />
                        </Box>

                        <HStack w="100%" justify="flex-end" gap={2}>
                          <Button size="sm" variant="outline" onClick={resetCompetencyForm}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleAddCompetency(domain, goal.id)}
                            loading={loading}
                          >
                            {editingCompetency ? 'Update' : 'Add'} Competency
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  )}
                  
                  {/* Competencies under this goal */}
                  {isExpanded && goal.competencies && goal.competencies.length > 0 && (
                    <Box mt={3} pl={4} borderLeft="3px solid" borderLeftColor={`${info.color}.200`}>
                      <VStack gap={2} align="stretch">
                        {goal.competencies.map((competency) => (
                          <Box
                            key={competency.id}
                            p={3}
                            bg="gray.50"
                            borderRadius="md"
                            border="1px solid"
                            borderColor="gray.100"
                            _hover={{ bg: 'gray.100' }}
                          >
                            <Flex align="start">
                              <Box flex={1}>
                                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                                  {competency.title}
                                </Text>
                                <Text fontSize="xs" color="gray.600" mb={2}>
                                  {competency.description}
                                </Text>
                                <Text fontSize="xs" color="gray.400">
                                  Created: {new Date(competency.createdAt).toLocaleDateString()}
                                  {competency.updatedAt && (
                                    <> • Updated: {new Date(competency.updatedAt).toLocaleDateString()}</>
                                  )}
                                </Text>
                              </Box>
                              <HStack gap={1}>
                                <Button
                                  size="xs"
                                  colorScheme="yellow"
                                  variant="outline"
                                  onClick={() => handleEditCompetency(competency, domain, goal.id)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  size="xs"
                                  colorScheme="red"
                                  variant="outline"
                                  onClick={() => handleDeleteCompetency(domain, goal.id, competency.id)}
                                >
                                  <FaTrash />
                                </Button>
                              </HStack>
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  )}
                  
                  {isExpanded && (!goal.competencies || goal.competencies.length === 0) && (
                    <Box mt={3} textAlign="center" py={4} color="gray.500">
                      <Text fontSize="sm">No competencies added yet</Text>
                      <Text fontSize="xs">Click "Add Competency" to get started</Text>
                    </Box>
                  )}
                </Box>
              );
            })}

            {domainGoals.length === 0 && (
              <Box textAlign="center" py={8} color="gray.500">
                <Text fontSize="sm">No curricular goals added yet</Text>
                <Text fontSize="xs">Click "Add Curricular Goal" to get started</Text>
              </Box>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  };

  return (
    <Box>
      <Heading mb={6} color="blue.600" size="lg">
        Competency Management
      </Heading>
      
      <Text mb={6} color="gray.600">
        Manage child development through a structured hierarchy: Domains → Curricular Goals → Competencies. Add curricular goals under each domain to organize specific competencies.
      </Text>

      <VStack gap={6} align="stretch">
        {(Object.keys(domainInfo) as Array<keyof CurricularGoalsData>).map(domain => 
          renderDomainSection(domain)
        )}
      </VStack>
    </Box>
  );
};

export default CompetencyManagement;