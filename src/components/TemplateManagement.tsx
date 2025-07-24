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
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaEye, FaCopy } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

interface Template {
  id: number;
  name: string;
  description: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
}

interface TemplateData {
  teacher: Template[];
  parent: Template[];
  student: Template[];
}

const TemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateData>({
    teacher: [],
    parent: [],
    student: []
  });
  const [activeTab, setActiveTab] = useState<keyof TemplateData>('teacher');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    templateCategory: '',
  });

  const categoryInfo = {
    teacher: {
      title: 'Teacher Templates',
      color: 'blue',
      description: 'Templates for lesson planning, assessments, and documentation',
      categories: ['lesson-planning', 'assessment', 'documentation', 'communication']
    },
    parent: {
      title: 'Parent Templates',
      color: 'green',
      description: 'Templates for parent communication and engagement',
      categories: ['communication', 'meetings', 'updates', 'events']
    },
    student: {
      title: 'Student Templates',
      color: 'purple',
      description: 'Templates for student activities and self-reflection',
      categories: ['reflection', 'goals', 'activities', 'portfolios']
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = async () => {
    try {
      if (editingTemplate) {
        await axios.put(`${API_BASE_URL}/api/templates/${activeTab}/${editingTemplate.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/templates/${activeTab}`, formData);
      }

      fetchTemplates();
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/templates/${activeTab}/${id}`);
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      content: template.content,
      templateCategory: template.category,
    });
    setShowAddForm(true);
  };

  const handleCopyTemplate = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.content);
      alert('Template content copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      templateCategory: '',
    });
    setEditingTemplate(null);
    setShowAddForm(false);
  };

  const currentTemplates = templates[activeTab] || [];
  const currentInfo = categoryInfo[activeTab];

  return (
    <Box>
      <Heading mb={6} color="blue.600" size="lg">
        Template Management
      </Heading>
      
      <Text mb={6} color="gray.600">
        Manage templates for teachers, parents, and students. View and edit existing templates or create new ones.
      </Text>

      {/* Tab Navigation */}
      <HStack mb={6} gap={4}>
        <Button
          variant={activeTab === 'teacher' ? 'solid' : 'outline'}
          colorScheme={categoryInfo.teacher.color}
          onClick={() => setActiveTab('teacher')}
        >
          Teacher Templates
        </Button>
        <Button
          variant={activeTab === 'parent' ? 'solid' : 'outline'}
          colorScheme={categoryInfo.parent.color}
          onClick={() => setActiveTab('parent')}
        >
          Parent Templates
        </Button>
        <Button
          variant={activeTab === 'student' ? 'solid' : 'outline'}
          colorScheme={categoryInfo.student.color}
          onClick={() => setActiveTab('student')}
        >
          Student Templates
        </Button>
      </HStack>

      {/* Tab Content */}
          <Card.Root>
            <Card.Header>
              <Flex align="center">
                <VStack align="start" gap={1}>
                  <Heading size="md" color={`${currentInfo.color}.600`}>
                    {currentInfo.title}
                  </Heading>
                  <Text fontSize="sm" color="gray.600">
                    {currentInfo.description}
                  </Text>
                </VStack>
                <Spacer />
                <Button
                  colorScheme={currentInfo.color}
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                >
                  <FaPlus />
                  Add Template
                </Button>
              </Flex>
            </Card.Header>

            <Card.Body>
              {/* Add/Edit Form */}
              {showAddForm && (
                <Box mb={6} p={4} bg="gray.50" borderRadius="md">
                  <VStack gap={4}>
                    <Flex align="center" w="100%">
                      <Heading size="sm">
                        {editingTemplate ? 'Edit Template' : 'Add New Template'}
                      </Heading>
                      <Spacer />
                      <Button size="xs" variant="ghost" onClick={resetForm}>
                        <FaTimes />
                      </Button>
                    </Flex>

                    <HStack w="100%" gap={4}>
                      <Box flex={2}>
                        <Text mb={2} fontWeight="medium" fontSize="sm">Template Name</Text>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter template name"
                        />
                      </Box>
                      <Box flex={1}>
                        <Text mb={2} fontWeight="medium" fontSize="sm">Category</Text>
                        <select
                          value={formData.templateCategory}
                          onChange={(e) => setFormData({ ...formData, templateCategory: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px',
                          }}
                        >
                          <option value="">Select category</option>
                          {currentInfo.categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </Box>
                    </HStack>

                    <Box w="100%">
                      <Text mb={2} fontWeight="medium" fontSize="sm">Description</Text>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the template"
                      />
                    </Box>

                    <Box w="100%">
                      <Text mb={2} fontWeight="medium" fontSize="sm">Template Content</Text>
                      <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Enter the template content..."
                        rows={8}
                        fontFamily="monospace"
                      />
                    </Box>

                    <HStack w="100%" justify="flex-end" gap={3}>
                      <Button variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                      <Button
                        colorScheme={currentInfo.color}
                        onClick={handleAddTemplate}
                        loading={loading}
                      >
                        {editingTemplate ? 'Update' : 'Add'} Template
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              )}

              {/* Templates Grid */}
              <VStack gap={4} align="stretch">
                {currentTemplates.map((template) => (
                  <Box
                    key={template.id}
                    p={4}
                    bg="white"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    _hover={{ borderColor: `${currentInfo.color}.200`, shadow: 'sm' }}
                    transition="all 0.2s"
                  >
                    <Flex align="start">
                      <Box flex={1}>
                        <HStack mb={2}>
                          <Heading size="sm" color={`${currentInfo.color}.700`}>
                            {template.name}
                          </Heading>
                          <Badge colorScheme={currentInfo.color} size="sm">
                            {template.category}
                          </Badge>
                        </HStack>
                        
                        <Text fontSize="sm" color="gray.600" mb={3}>
                          {template.description}
                        </Text>
                        
                        <Box bg="gray.50" p={3} borderRadius="md" mb={3}>
                          <Text fontSize="xs" fontFamily="monospace" color="gray.700" lineClamp={3}>
                            {template.content}
                          </Text>
                        </Box>
                        
                        <Text fontSize="xs" color="gray.400">
                          Created: {new Date(template.createdAt).toLocaleDateString()}
                          {template.updatedAt && (
                            <> • Updated: {new Date(template.updatedAt).toLocaleDateString()}</>
                          )}
                        </Text>
                      </Box>
                      
                      <VStack gap={2}>
                        <Button
                          size="xs"
                          colorScheme="gray"
                          variant="outline"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <FaEye />
                        </Button>
                        <Button
                          size="xs"
                          colorScheme="teal"
                          variant="outline"
                          onClick={() => handleCopyTemplate(template)}
                        >
                          <FaCopy />
                        </Button>
                        <Button
                          size="xs"
                          colorScheme="yellow"
                          variant="outline"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          size="xs"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <FaTrash />
                        </Button>
                      </VStack>
                    </Flex>
                  </Box>
                ))}

                {currentTemplates.length === 0 && (
                  <Box textAlign="center" py={12} color="gray.500">
                    <Text fontSize="lg" mb={2}>No templates found</Text>
                    <Text fontSize="sm">Click "Add Template" to create your first template</Text>
                  </Box>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>

      {/* Preview Modal */}
      {previewTemplate && (
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
          onClick={() => setPreviewTemplate(null)}
        >
          <Box
            bg="white"
            borderRadius="md"
            maxW="800px"
            maxH="80vh"
            w="90%"
            overflow="hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Box p={6} borderBottom="1px solid" borderColor="gray.200">
              <Flex align="center">
                <VStack align="start" gap={1}>
                  <Heading size="md">{previewTemplate.name}</Heading>
                  <Text fontSize="sm" color="gray.600">{previewTemplate.description}</Text>
                </VStack>
                <Spacer />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreviewTemplate(null)}
                >
                  <FaTimes />
                </Button>
              </Flex>
            </Box>
            
            <Box p={6} maxH="60vh" overflow="auto">
              <Box bg="gray.50" p={4} borderRadius="md">
                <Text
                  fontFamily="monospace"
                  fontSize="sm"
                  whiteSpace="pre-wrap"
                  color="gray.700"
                >
                  {previewTemplate.content}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TemplateManagement;