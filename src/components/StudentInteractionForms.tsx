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

  const [generalInfoData, setGeneralInfoData] = useState({
    myNameIs: '',
    thingsILike: '',
    iLiveIn: '',
    myBirthday: '',
    myFriendsAre: '',
    myFavouriteColours: '',
    myFavouriteFoods: '',
    myFavouriteGames: '',
    myFavouriteAnimals: '',
    height: '',
    weight: '',
  });

  const formConfig = {
    general: {
      title: 'General Student Information Form',
      color: 'blue',
      fields: ['generalInfo'],
      isGeneralInfo: true
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

  // Load existing general info data when component mounts for general form
  useEffect(() => {
    if (formType === 'general') {
      fetchGeneralInfo();
    }
  }, [formType, student.id]);

  const fetchGeneralInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/students/${student.id}/general-info`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setGeneralInfoData(prevData => ({ ...prevData, ...response.data }));
    } catch (error) {
      console.error('Error fetching general info:', error);
      // If no existing data, just continue with empty form
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let endpoint, payload;
      
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      if (formType === 'general') {
        endpoint = '/api/students/general-info';
        payload = {
          studentId: student.id,
          generalInfo: generalInfoData
        };
      } else if (formType === 'observation') {
        endpoint = '/api/observations';
        payload = {
          studentId: student.id,
          ...formData
        };
      } else {
        endpoint = `/api/feedback/${formType}`;
        payload = {
          studentId: student.id,
          ...formData
        };
      }

      await axios.post(`${API_BASE_URL}${endpoint}`, payload, { headers });
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
            {/* General Info Fields */}
            {formType === 'general' && (
              <>
                <Box>
                  <Text mb={2} fontWeight="medium">My name is</Text>
                  <Input
                    value={generalInfoData.myNameIs}
                    onChange={(e) => setGeneralInfoData({ ...generalInfoData, myNameIs: e.target.value })}
                    placeholder="What the child likes to be called"
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">Things I like</Text>
                  <Textarea
                    value={generalInfoData.thingsILike}
                    onChange={(e) => setGeneralInfoData({ ...generalInfoData, thingsILike: e.target.value })}
                    placeholder="Activities, subjects, hobbies the child enjoys"
                    rows={3}
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">I live in</Text>
                  <Input
                    value={generalInfoData.iLiveIn}
                    onChange={(e) => setGeneralInfoData({ ...generalInfoData, iLiveIn: e.target.value })}
                    placeholder="Area, neighborhood, or city where the child lives"
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">My birthday</Text>
                  <Input
                    type="date"
                    value={generalInfoData.myBirthday}
                    onChange={(e) => setGeneralInfoData({ ...generalInfoData, myBirthday: e.target.value })}
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">My friends are</Text>
                  <Textarea
                    value={generalInfoData.myFriendsAre}
                    onChange={(e) => setGeneralInfoData({ ...generalInfoData, myFriendsAre: e.target.value })}
                    placeholder="Names of close friends or classmates"
                    rows={2}
                  />
                </Box>

                <HStack gap={4}>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">My favourite colours</Text>
                    <Input
                      value={generalInfoData.myFavouriteColours}
                      onChange={(e) => setGeneralInfoData({ ...generalInfoData, myFavouriteColours: e.target.value })}
                      placeholder="e.g., Blue, Red, Yellow"
                    />
                  </Box>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">My favourite foods</Text>
                    <Input
                      value={generalInfoData.myFavouriteFoods}
                      onChange={(e) => setGeneralInfoData({ ...generalInfoData, myFavouriteFoods: e.target.value })}
                      placeholder="e.g., Pizza, Ice cream, Fruits"
                    />
                  </Box>
                </HStack>

                <HStack gap={4}>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">My favourite games</Text>
                    <Input
                      value={generalInfoData.myFavouriteGames}
                      onChange={(e) => setGeneralInfoData({ ...generalInfoData, myFavouriteGames: e.target.value })}
                      placeholder="e.g., Hide and seek, Drawing, Building blocks"
                    />
                  </Box>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">My favourite animals</Text>
                    <Input
                      value={generalInfoData.myFavouriteAnimals}
                      onChange={(e) => setGeneralInfoData({ ...generalInfoData, myFavouriteAnimals: e.target.value })}
                      placeholder="e.g., Dogs, Cats, Elephants"
                    />
                  </Box>
                </HStack>

                <HStack gap={4}>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">Height</Text>
                    <Input
                      value={generalInfoData.height}
                      onChange={(e) => setGeneralInfoData({ ...generalInfoData, height: e.target.value })}
                      placeholder="e.g., 120 cm"
                    />
                  </Box>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">Weight</Text>
                    <Input
                      value={generalInfoData.weight}
                      onChange={(e) => setGeneralInfoData({ ...generalInfoData, weight: e.target.value })}
                      placeholder="e.g., 25 kg"
                    />
                  </Box>
                </HStack>
              </>
            )}

            {/* Main Content Field for other forms */}
            {formType !== 'general' && (
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
            )}

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