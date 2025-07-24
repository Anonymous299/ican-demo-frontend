import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { FaTimes, FaSave } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

interface Student {
  id: number;
  name: string;
  age: number;
  classId: number;
  dateOfBirth: string;
  parentContact: string;
  notes: string;
}

interface BaseFormConfig {
  title: string;
  color: string;
  fields: string[];
}

interface FeedbackFormConfig extends BaseFormConfig {
  categories: string[];
}

interface ObservationFormConfig extends BaseFormConfig {
  domains: string[];
  settings: string[];
}

type FormConfig = FeedbackFormConfig | ObservationFormConfig;

interface StudentInteractionFormsProps {
  student: Student;
  onClose: () => void;
  formType: 'general' | 'parent' | 'student' | 'peer' | 'observation';
}

const StudentInteractionForms: React.FC<StudentInteractionFormsProps> = ({
  student,
  onClose,
  formType
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    category: '',
    domain: '',
    competency: '',
    setting: 'classroom',
    duration: '',
  });

  const formConfig = {
    general: {
      title: 'General Student Information Form',
      color: 'blue',
      fields: ['content', 'category'],
      categories: ['academic', 'social', 'behavioral', 'health', 'other']
    },
    parent: {
      title: 'Parent Feedback Form',
      color: 'green',
      fields: ['content', 'category'],
      categories: ['communication', 'concerns', 'suggestions', 'praise', 'meeting-request']
    },
    student: {
      title: 'Student Feedback Form', 
      color: 'orange',
      fields: ['content', 'category'],
      categories: ['self-reflection', 'goals', 'interests', 'challenges', 'achievements']
    },
    peer: {
      title: 'Peer Feedback Form',
      color: 'purple',
      fields: ['content', 'category'],
      categories: ['collaboration', 'friendship', 'conflict-resolution', 'teamwork', 'social-skills']
    },
    observation: {
      title: 'Teacher Observation Form',
      color: 'teal',
      fields: ['content', 'domain', 'competency', 'setting', 'duration'],
      domains: ['CG-1', 'CG-2', 'CG-3', 'academic', 'social-emotional'],
      settings: ['classroom', 'playground', 'lunch', 'assembly', 'field-trip', 'other']
    }
  };

  const config = formConfig[formType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = formType === 'observation' ? '/api/observations' : `/api/feedback/${formType}`;
      const payload = {
        studentId: student.id,
        ...formData
      };

      await axios.post(`${API_BASE_URL}${endpoint}`, payload);
      alert(`${config.title} saved successfully!`);
      onClose();
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card.Root>
      <Card.Header>
        <Flex align="center">
          <VStack align="start" gap={1}>
            <Heading size="md" color={`${config.color}.600`}>
              {config.title}
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
          <VStack gap={4} align="stretch">
            {/* Main Content Field */}
            <Box>
              <Text mb={2} fontWeight="medium">
                {formType === 'observation' ? 'Observation Notes' : 'Feedback Content'}
              </Text>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={`Enter detailed ${formType === 'observation' ? 'observations' : 'feedback'}...`}
                rows={6}
                required
              />
            </Box>

            {/* Category Field */}
            {config.fields.includes('category') && (
              <Box>
                <Text mb={2} fontWeight="medium">Category</Text>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                  }}
                  required
                >
                  <option value="">Select category</option>
                  {('categories' in config) && config.categories?.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </Box>
            )}

            {/* Domain Field (Observation only) */}
            {config.fields.includes('domain') && (
              <HStack gap={4}>
                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">Domain</Text>
                  <select
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select domain (optional)</option>
                    {('domains' in config) && config.domains?.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </Box>

                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">Related Competency</Text>
                  <Input
                    value={formData.competency}
                    onChange={(e) => setFormData({ ...formData, competency: e.target.value })}
                    placeholder="Related competency (optional)"
                  />
                </Box>
              </HStack>
            )}

            {/* Setting and Duration (Observation only) */}
            {config.fields.includes('setting') && (
              <HStack gap={4}>
                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">Setting</Text>
                  <select
                    value={formData.setting}
                    onChange={(e) => setFormData({ ...formData, setting: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                    }}
                  >
                    {('settings' in config) && config.settings?.map(setting => (
                      <option key={setting} value={setting}>
                        {setting.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </Box>

                <Box flex={1}>
                  <Text mb={2} fontWeight="medium">Duration (minutes)</Text>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 15"
                    min="1"
                  />
                </Box>
              </HStack>
            )}

            {/* Submit Buttons */}
            <HStack justify="flex-end" gap={3} pt={4}>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme={config.color}
                loading={loading}
              >
                <FaSave />
                Save {formType === 'observation' ? 'Observation' : 'Feedback'}
              </Button>
            </HStack>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  );
};

export default StudentInteractionForms;