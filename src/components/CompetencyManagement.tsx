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
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

interface Competency {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}

interface CompetencyData {
  'CG-1': Competency[];
  'CG-2': Competency[];
  'CG-3': Competency[];
}

const CompetencyManagement: React.FC = () => {
  const [competencies, setCompetencies] = useState<CompetencyData>({
    'CG-1': [],
    'CG-2': [],
    'CG-3': []
  });
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState<string | null>(null);
  const [editingCompetency, setEditingCompetency] = useState<{competency: Competency, domain: string} | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  const domainInfo = {
    'CG-1': {
      title: 'CG-1: Children develop habits that keep them healthy and safe',
      color: 'blue',
      description: 'Focuses on health, safety, and well-being habits'
    },
    'CG-2': {
      title: 'CG-2: Children develop sharpness in sensorial perceptions',
      color: 'green',
      description: 'Develops sensory awareness and perception skills'
    },
    'CG-3': {
      title: 'CG-3: Children develop a fit and flexible body',
      color: 'purple',
      description: 'Promotes physical fitness and motor skills'
    }
  };

  useEffect(() => {
    fetchCompetencies();
  }, []);

  const fetchCompetencies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/competencies`);
      setCompetencies(response.data);
    } catch (error) {
      console.error('Error fetching competencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetency = async (domain: string) => {
    try {
      if (editingCompetency) {
        await axios.put(`${API_BASE_URL}/api/competencies/${domain}/${editingCompetency.competency.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/competencies/${domain}`, formData);
      }

      fetchCompetencies();
      resetForm();
    } catch (error) {
      console.error('Error saving competency:', error);
    }
  };

  const handleDeleteCompetency = async (domain: string, id: number) => {
    if (window.confirm('Are you sure you want to delete this competency?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/competencies/${domain}/${id}`);
        fetchCompetencies();
      } catch (error) {
        console.error('Error deleting competency:', error);
      }
    }
  };

  const handleEditCompetency = (competency: Competency, domain: string) => {
    setEditingCompetency({ competency, domain });
    setFormData({
      title: competency.title,
      description: competency.description,
    });
    setShowAddForm(domain);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
    });
    setEditingCompetency(null);
    setShowAddForm(null);
  };

  const renderCompetencySection = (domain: keyof CompetencyData) => {
    const info = domainInfo[domain];
    const domainCompetencies = competencies[domain] || [];

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
              Add Competency
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
                    {editingCompetency ? 'Edit Competency' : 'Add New Competency'}
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
                    placeholder="Competency title"
                  />
                </Box>

                <Box w="100%">
                  <Text mb={2} fontWeight="medium" fontSize="sm">Description</Text>
                  <Textarea
                    size="sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of the competency"
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
                    onClick={() => handleAddCompetency(domain)}
                    loading={loading}
                  >
                    {editingCompetency ? 'Update' : 'Add'} Competency
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )}

          {/* Competencies List */}
          <VStack gap={3} align="stretch">
            {domainCompetencies.map((competency) => (
              <Box
                key={competency.id}
                p={4}
                bg="white"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
                _hover={{ borderColor: `${info.color}.200`, shadow: 'sm' }}
                transition="all 0.2s"
              >
                <Flex align="start">
                  <Box flex={1}>
                    <Heading size="sm" mb={2} color={`${info.color}.700`}>
                      {competency.title}
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      {competency.description}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      Created: {new Date(competency.createdAt).toLocaleDateString()}
                      {competency.updatedAt && (
                        <> • Updated: {new Date(competency.updatedAt).toLocaleDateString()}</>
                      )}
                    </Text>
                  </Box>
                  <HStack gap={2}>
                    <Button
                      size="xs"
                      colorScheme="yellow"
                      variant="outline"
                      onClick={() => handleEditCompetency(competency, domain)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleDeleteCompetency(domain, competency.id)}
                    >
                      <FaTrash />
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            ))}

            {domainCompetencies.length === 0 && (
              <Box textAlign="center" py={8} color="gray.500">
                <Text fontSize="sm">No competencies added yet</Text>
                <Text fontSize="xs">Click "Add Competency" to get started</Text>
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
        Manage child development competencies across three key domains. Each competency can be manually added or selected from predefined options.
      </Text>

      <VStack gap={6} align="stretch">
        {(Object.keys(domainInfo) as Array<keyof CompetencyData>).map(domain => 
          renderCompetencySection(domain)
        )}
      </VStack>
    </Box>
  );
};

export default CompetencyManagement;