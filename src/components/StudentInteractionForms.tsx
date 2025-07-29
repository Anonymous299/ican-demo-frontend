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
  formType: 'general' | 'parent' | 'student' | 'peer' | 'observation' | 'assessment';
  selectedTerm?: 'term1' | 'term2';
}

const StudentInteractionForms: React.FC<StudentInteractionFormsProps> = ({
  student,
  onClose,
  formType,
  selectedTerm = 'term1'
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
  const [rubric, setRubric] = useState({
    awareness: { stream: '', mountain: '', sky: '' },
    sensitivity: { stream: '', mountain: '', sky: '' },
    creativity: { stream: '', mountain: '', sky: '' }
  });
  const [rubricEntries, setRubricEntries] = useState<any[]>([]);

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
      title: 'Teacher Anecdote Form',
      color: 'teal',
      fields: ['content', 'domain', 'competency', 'setting', 'duration'],
      domains: ['CG-1', 'CG-2', 'CG-3', 'academic', 'social-emotional'],
      settings: ['classroom', 'playground', 'lunch', 'assembly', 'field-trip', 'other']
    },
    assessment: {
      title: 'Assessment Rubric',
      color: 'blue',
      fields: ['rubric'],
      activities: []
    }
  };

  const config = formConfig[formType];

  // Load existing general info data when component mounts for general form
  useEffect(() => {
    if (formType === 'general') {
      fetchGeneralInfo();
    } else if (formType === 'assessment') {
      fetchRubricEntries();
      fetchExistingAssessment();
    }
  }, [formType, student.id, selectedTerm]);

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

  const fetchRubricEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/rubric-entries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRubricEntries(response.data);
    } catch (error) {
      console.error('Error fetching rubric entries:', error);
    }
  };

  const handleRubricChange = (dimension: string, level: string, value: string) => {
    setRubric(prev => ({
      ...prev,
      [dimension]: {
        ...prev[dimension],
        [level]: value
      }
    }));
  };

  const getRubricEntriesForLevel = (dimension: string, level: string) => {
    const entry = rubricEntries.find(entry => 
      entry.dimension === dimension && entry.level === level
    );
    return entry ? entry.entries : [];
  };

  const fetchExistingAssessment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/assessments/${student.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Find assessment for the selected term
      const existingAssessment = response.data.find(assessment => assessment.term === selectedTerm);
      
      if (existingAssessment && existingAssessment.rubric) {
        setRubric(existingAssessment.rubric);
      } else {
        // Reset to empty rubric if no existing assessment for this term
        setRubric({
          awareness: { stream: '', mountain: '', sky: '' },
          sensitivity: { stream: '', mountain: '', sky: '' },
          creativity: { stream: '', mountain: '', sky: '' }
        });
      }
    } catch (error) {
      console.error('Error fetching existing assessment:', error);
      // If no existing data, just continue with empty rubric
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
          term: selectedTerm,
          ...formData
        };
      } else if (formType === 'assessment') {
        // Use PUT to handle both create and update
        endpoint = `/api/assessments/${student.id}/${selectedTerm}`;
        payload = {
          rubric: rubric
        };
      } else {
        endpoint = `/api/feedback/${formType}`;
        payload = {
          studentId: student.id,
          term: selectedTerm,
          ...formData
        };
      }

      if (formType === 'assessment') {
        await axios.put(`${API_BASE_URL}${endpoint}`, payload, { headers });
      } else {
        await axios.post(`${API_BASE_URL}${endpoint}`, payload, { headers });
      }
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
              {formType !== 'general' && ` • ${selectedTerm === 'term1' ? 'Term 1' : 'Term 2'}`}
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

            {/* Assessment Rubric Form */}
            {formType === 'assessment' && (
              <Box>
                <Text mb={4} fontWeight="medium" fontSize="lg">Assessment Rubric for {student.name}</Text>
                <Text mb={4} fontSize="sm" color="gray.600">
                  Use the dropdowns to select from sample criteria or type custom assessments for each level.
                </Text>
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
                          <VStack gap={2} align="stretch">
                            <select
                              value={rubric.awareness.stream}
                              onChange={(e) => handleRubricChange('awareness', 'stream', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                              }}
                            >
                              <option value="">Select sample or type below...</option>
                              {getRubricEntriesForLevel('awareness', 'stream').map((entry, index) => (
                                <option key={index} value={entry}>
                                  {entry}
                                </option>
                              ))}
                            </select>
                            <Textarea
                              value={rubric.awareness.stream}
                              onChange={(e) => handleRubricChange('awareness', 'stream', e.target.value)}
                              placeholder="Type custom criteria or select from dropdown above..."
                              size="sm"
                              rows={2}
                            />
                          </VStack>
                        </Table.Cell>
                        <Table.Cell p={2}>
                          <VStack gap={2} align="stretch">
                            <select
                              value={rubric.awareness.mountain}
                              onChange={(e) => handleRubricChange('awareness', 'mountain', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                              }}
                            >
                              <option value="">Select sample or type below...</option>
                              {getRubricEntriesForLevel('awareness', 'mountain').map((entry, index) => (
                                <option key={index} value={entry}>
                                  {entry}
                                </option>
                              ))}
                            </select>
                            <Textarea
                              value={rubric.awareness.mountain}
                              onChange={(e) => handleRubricChange('awareness', 'mountain', e.target.value)}
                              placeholder="Type custom criteria or select from dropdown above..."
                              size="sm"
                              rows={2}
                            />
                          </VStack>
                        </Table.Cell>
                        <Table.Cell p={2}>
                          <VStack gap={2} align="stretch">
                            <select
                              value={rubric.awareness.sky}
                              onChange={(e) => handleRubricChange('awareness', 'sky', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                              }}
                            >
                              <option value="">Select sample or type below...</option>
                              {getRubricEntriesForLevel('awareness', 'sky').map((entry, index) => (
                                <option key={index} value={entry}>
                                  {entry}
                                </option>
                              ))}
                            </select>
                            <Textarea
                              value={rubric.awareness.sky}
                              onChange={(e) => handleRubricChange('awareness', 'sky', e.target.value)}
                              placeholder="Type custom criteria or select from dropdown above..."
                              size="sm"
                              rows={2}
                            />
                          </VStack>
                        </Table.Cell>
                      </Table.Row>

                      {/* Sensitivity Row */}
                      <Table.Row>
                        <Table.Cell fontWeight="medium" bg="green.50" color="green.700">
                          Sensitivity
                        </Table.Cell>
                        <Table.Cell p={2}>
                          <VStack gap={2} align="stretch">
                            <select
                              value={rubric.sensitivity.stream}
                              onChange={(e) => handleRubricChange('sensitivity', 'stream', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                              }}
                            >
                              <option value="">Select sample or type below...</option>
                              {getRubricEntriesForLevel('sensitivity', 'stream').map((entry, index) => (
                                <option key={index} value={entry}>
                                  {entry}
                                </option>
                              ))}
                            </select>
                            <Textarea
                              value={rubric.sensitivity.stream}
                              onChange={(e) => handleRubricChange('sensitivity', 'stream', e.target.value)}
                              placeholder="Type custom criteria or select from dropdown above..."
                              size="sm"
                              rows={2}
                            />
                          </VStack>
                        </Table.Cell>
                        <Table.Cell p={2}>
                          <VStack gap={2} align="stretch">
                            <select
                              value={rubric.sensitivity.mountain}
                              onChange={(e) => handleRubricChange('sensitivity', 'mountain', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                              }}
                            >
                              <option value="">Select sample or type below...</option>
                              {getRubricEntriesForLevel('sensitivity', 'mountain').map((entry, index) => (
                                <option key={index} value={entry}>
                                  {entry}
                                </option>
                              ))}
                            </select>
                            <Textarea
                              value={rubric.sensitivity.mountain}
                              onChange={(e) => handleRubricChange('sensitivity', 'mountain', e.target.value)}
                              placeholder="Type custom criteria or select from dropdown above..."
                              size="sm"
                              rows={2}
                            />
                          </VStack>
                        </Table.Cell>
                        <Table.Cell p={2}>
                          <VStack gap={2} align="stretch">
                            <select
                              value={rubric.sensitivity.sky}
                              onChange={(e) => handleRubricChange('sensitivity', 'sky', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                              }}
                            >
                              <option value="">Select sample or type below...</option>
                              {getRubricEntriesForLevel('sensitivity', 'sky').map((entry, index) => (
                                <option key={index} value={entry}>
                                  {entry}
                                </option>
                              ))}
                            </select>
                            <Textarea
                              value={rubric.sensitivity.sky}
                              onChange={(e) => handleRubricChange('sensitivity', 'sky', e.target.value)}
                              placeholder="Type custom criteria or select from dropdown above..."
                              size="sm"
                              rows={2}
                            />
                          </VStack>
                        </Table.Cell>
                      </Table.Row>

                      {/* Creativity Row */}
                      <Table.Row>
                        <Table.Cell fontWeight="medium" bg="purple.50" color="purple.700">
                          Creativity
                        </Table.Cell>
                        <Table.Cell p={2}>
                          <VStack gap={2} align="stretch">
                            <select
                              value={rubric.creativity.stream}
                              onChange={(e) => handleRubricChange('creativity', 'stream', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                              }}
                            >
                              <option value="">Select sample or type below...</option>
                              {getRubricEntriesForLevel('creativity', 'stream').map((entry, index) => (
                                <option key={index} value={entry}>
                                  {entry}
                                </option>
                              ))}
                            </select>
                            <Textarea
                              value={rubric.creativity.stream}
                              onChange={(e) => handleRubricChange('creativity', 'stream', e.target.value)}
                              placeholder="Type custom criteria or select from dropdown above..."
                              size="sm"
                              rows={2}
                            />
                          </VStack>
                        </Table.Cell>
                        <Table.Cell p={2}>
                          <VStack gap={2} align="stretch">
                            <select
                              value={rubric.creativity.mountain}
                              onChange={(e) => handleRubricChange('creativity', 'mountain', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                              }}
                            >
                              <option value="">Select sample or type below...</option>
                              {getRubricEntriesForLevel('creativity', 'mountain').map((entry, index) => (
                                <option key={index} value={entry}>
                                  {entry}
                                </option>
                              ))}
                            </select>
                            <Textarea
                              value={rubric.creativity.mountain}
                              onChange={(e) => handleRubricChange('creativity', 'mountain', e.target.value)}
                              placeholder="Type custom criteria or select from dropdown above..."
                              size="sm"
                              rows={2}
                            />
                          </VStack>
                        </Table.Cell>
                        <Table.Cell p={2}>
                          <VStack gap={2} align="stretch">
                            <select
                              value={rubric.creativity.sky}
                              onChange={(e) => handleRubricChange('creativity', 'sky', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                              }}
                            >
                              <option value="">Select sample or type below...</option>
                              {getRubricEntriesForLevel('creativity', 'sky').map((entry, index) => (
                                <option key={index} value={entry}>
                                  {entry}
                                </option>
                              ))}
                            </select>
                            <Textarea
                              value={rubric.creativity.sky}
                              onChange={(e) => handleRubricChange('creativity', 'sky', e.target.value)}
                              placeholder="Type custom criteria or select from dropdown above..."
                              size="sm"
                              rows={2}
                            />
                          </VStack>
                        </Table.Cell>
                      </Table.Row>
                    </Table.Body>
                  </Table.Root>
                </Box>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  Fill out the rubric to define assessment criteria at different levels of achievement for this student.
                </Text>
              </Box>
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
                Save {formType === 'assessment' ? 'Assessment' : formType === 'observation' ? 'Observation' : 'Feedback'}
              </Button>
            </HStack>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  );
};

export default StudentInteractionForms;