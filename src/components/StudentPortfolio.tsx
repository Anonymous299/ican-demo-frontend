import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Flex,
  Spacer,
  SimpleGrid,
  Image,
  Badge,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { FaTimes, FaUpload, FaImage, FaCalendarAlt, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

interface Student {
  id: number;
  name: string;
  age: number;
  classId: number;
}

interface PortfolioItem {
  id: number;
  studentId: number;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  category: string;
}

interface StudentPortfolioProps {
  student: Student;
  onClose: () => void;
}

const StudentPortfolio: React.FC<StudentPortfolioProps> = ({
  student,
  onClose
}) => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'artwork'
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'artwork', 'craft', 'writing', 'project', 'achievement', 'milestone', 'other'
  ];

  useEffect(() => {
    fetchPortfolioItems();
  }, [student.id]);

  const fetchPortfolioItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const response = await axios.get(`${API_BASE_URL}/api/portfolio/${student.id}`, { headers });
      setPortfolioItems(response.data);
    } catch (error) {
      console.error('Error fetching portfolio items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      alert('Please select only image files (JPEG, PNG, GIF, etc.)');
      return;
    }
    
    if (imageFiles.length > 5) {
      alert('Please select up to 5 images at a time');
      return;
    }
    
    setSelectedFiles(imageFiles);
  };

  const handleUpload = async () => {
    if (!uploadForm.title.trim()) {
      alert('Please enter a title for this portfolio entry');
      return;
    }
    
    if (selectedFiles.length === 0) {
      alert('Please select at least one image');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // For this demo, we'll simulate file upload by creating placeholder entries
      // In a real app, you'd upload files to a cloud storage service
      const newItems = selectedFiles.map((file, index) => ({
        studentId: student.id,
        title: selectedFiles.length > 1 ? `${uploadForm.title} (${index + 1})` : uploadForm.title,
        description: uploadForm.description,
        category: uploadForm.category,
        imageUrl: URL.createObjectURL(file), // Demo: using blob URL
        fileName: file.name
      }));

      for (const item of newItems) {
        await axios.post(`${API_BASE_URL}/api/portfolio`, item, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      alert(`Successfully uploaded ${selectedFiles.length} portfolio item(s)!`);
      setUploadForm({ title: '', description: '', category: 'artwork' });
      setSelectedFiles([]);
      setShowUploadForm(false);
      fetchPortfolioItems();
    } catch (error) {
      console.error('Error uploading portfolio items:', error);
      alert('Error uploading portfolio items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (window.confirm('Are you sure you want to delete this portfolio item?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/portfolio/${itemId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('Portfolio item deleted successfully!');
        fetchPortfolioItems();
      } catch (error) {
        console.error('Error deleting portfolio item:', error);
        alert('Error deleting portfolio item. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      artwork: 'purple',
      craft: 'orange',
      writing: 'blue',
      project: 'green',
      achievement: 'gold',
      milestone: 'red',
      other: 'gray'
    };
    return colors[category as keyof typeof colors] || 'gray';
  };

  return (
    <Box>
      <Card.Root>
        <Card.Header>
          <Flex align="center">
            <VStack align="start" gap={1}>
              <Heading size="md" color="purple.600">
                Portfolio
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Art and projects for {student.name}
              </Text>
            </VStack>
            <Spacer />
            <HStack gap={2}>
              <Button 
                size="sm" 
                colorScheme="purple" 
                onClick={() => setShowUploadForm(!showUploadForm)}
              >
                <FaUpload />
                Upload Art
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <FaTimes />
              </Button>
            </HStack>
          </Flex>
        </Card.Header>

        <Card.Body>
          {/* Upload Form */}
          {showUploadForm && (
            <Box mb={6} p={4} bg="purple.50" borderRadius="md" border="1px solid" borderColor="purple.200">
              <VStack gap={4} align="stretch">
                <Heading size="sm" color="purple.700">Upload New Portfolio Items</Heading>
                
                <HStack gap={4} align="start">
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium" fontSize="sm">Title</Text>
                    <Input
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="Enter title for this portfolio entry..."
                      size="sm"
                      required
                    />
                  </Box>
                  <Box>
                    <Text mb={2} fontWeight="medium" fontSize="sm">Category</Text>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      style={{
                        width: '140px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                      }}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </Box>
                </HStack>

                <Box>
                  <Text mb={2} fontWeight="medium" fontSize="sm">Description (Optional)</Text>
                  <Textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Add a description for this portfolio entry..."
                    size="sm"
                    rows={2}
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium" fontSize="sm">Select Images (Up to 5)</Text>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    size="sm"
                  />
                  {selectedFiles.length > 0 && (
                    <Box mt={2}>
                      <Text fontSize="sm" color="green.600">
                        Selected {selectedFiles.length} file(s): {selectedFiles.map(f => f.name).join(', ')}
                      </Text>
                    </Box>
                  )}
                </Box>

                <HStack justify="flex-end" gap={3}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowUploadForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="purple" 
                    size="sm" 
                    onClick={handleUpload}
                    loading={loading}
                  >
                    Upload Portfolio Items
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )}

          {/* Portfolio Items Grid */}
          {loading ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">Loading portfolio...</Text>
            </Box>
          ) : portfolioItems.length === 0 ? (
            <Box textAlign="center" py={8} color="gray.500">
              <FaImage size={48} style={{ margin: '0 auto 16px' }} />
              <Text fontSize="lg" mb={2}>No portfolio items yet</Text>
              <Text fontSize="sm">
                Upload some of {student.name}'s artwork and projects to get started
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
              {portfolioItems.map((item) => (
                <Card.Root key={item.id} boxShadow="sm" _hover={{ shadow: 'md' }} transition="shadow 0.2s">
                  <Box position="relative">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      w="100%"
                      h="200px"
                      objectFit="cover"
                      borderTopRadius="md"
                      fallback={
                        <Box 
                          w="100%" 
                          h="200px" 
                          bg="gray.100" 
                          display="flex" 
                          alignItems="center" 
                          justifyContent="center"
                          borderTopRadius="md"
                        >
                          <FaImage size={32} color="#ccc" />
                        </Box>
                      }
                    />
                    <Button
                      position="absolute"
                      top={2}
                      right={2}
                      size="xs"
                      colorScheme="red"
                      variant="solid"
                      onClick={() => handleDelete(item.id)}
                    >
                      <FaTrash />
                    </Button>
                  </Box>
                  
                  <Card.Body>
                    <VStack align="start" gap={2}>
                      <HStack justify="space-between" w="100%">
                        <Heading size="sm" color="purple.700" lineClamp={1}>
                          {item.title}
                        </Heading>
                        <Badge colorScheme={getCategoryColor(item.category)} size="sm">
                          {item.category}
                        </Badge>
                      </HStack>
                      
                      {item.description && (
                        <Text fontSize="sm" color="gray.600" lineClamp={2}>
                          {item.description}
                        </Text>
                      )}
                      
                      <HStack gap={2} fontSize="xs" color="gray.400">
                        <FaCalendarAlt />
                        <Text>{formatDate(item.createdAt)}</Text>
                      </HStack>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              ))}
            </SimpleGrid>
          )}
        </Card.Body>
      </Card.Root>
    </Box>
  );
};

export default StudentPortfolio;