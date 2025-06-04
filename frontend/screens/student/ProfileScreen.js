import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform, Image } from 'react-native';
import { TextInput, Button, Text, Checkbox, Card, Title, ActivityIndicator, TouchableRipple, IconButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker'; // Import expo-image-picker
import { API_BASE_URL } from '../../utils/ip';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3B82F6',
    accent: '#EC4899',
    background: '#F8FAFC',
    text: '#1E293B',
    placeholder: '#64748B',
    surface: '#FFFFFF',
  },
};

export default function ProfileScreen({ route, navigation }) {
  const { user, onProfileUpdated } = route.params;
  const [personalDetails, setPersonalDetails] = useState({
    profile_photo: '',
    full_name: user.name || '',
    email: user.email,
    dob: '',
    phone: '',
    address: '',
    father_name: '',
    mother_name: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    objective: '',
  });
  const [education, setEducation] = useState([{ institution_name: '', degree: '', branch: '', start_year: '', end_year: '', grade: '' }]);
  const [skills, setSkills] = useState([{ skill_name: '', proficiency_level: '' }]);
  const [workExperience, setWorkExperience] = useState([{ company_name: '', role: '', start_date: '', end_date: '', is_current: false, description: '' }]);
  const [projects, setProjects] = useState([{ project_title: '', technologies_used: '', description: '', project_link: '' }]);
  const [certifications, setCertifications] = useState([{ certificate_name: '', issuing_organization: '', issue_date: '', certificate_link: '' }]);
  const [achievements, setAchievements] = useState([{ title: '', description: '', date: '' }]);
  const [languages, setLanguages] = useState([{ language_name: '', proficiency_level: '' }]);
  const [hobbies, setHobbies] = useState([{ hobby_name: '' }]);
  const [references, setReferences] = useState([{ reference_name: '', relation: '', contact_info: '' }]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState(null);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    personalDetails: true,
    education: false,
    skills: false,
    workExperience: false,
    projects: false,
    certifications: false,
    achievements: false,
    languages: false,
    hobbies: false,
    references: false,
  });
  const [imagePreview, setImagePreview] = useState(null); // State for image preview

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/profile/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = response.data.profile;
        setCanEdit(response.data.can_edit_profile);

        let parsedDetails = { ...personalDetails, full_name: user.name, email: user.email };
        try {
          if (profile.personal_details) {
            parsedDetails = typeof profile.personal_details === 'string'
              ? JSON.parse(profile.personal_details)
              : profile.personal_details;
            parsedDetails = {
              profile_photo: parsedDetails.profile_photo || '',
              full_name: parsedDetails.full_name || user.name || '',
              email: user.email || parsedDetails.email || '',
              dob: parsedDetails.dob || '',
              phone: parsedDetails.phone || '',
              address: parsedDetails.address || '',
              father_name: parsedDetails.father_name || '',
              mother_name: parsedDetails.mother_name || '',
              linkedin_url: parsedDetails.linkedin_url || '',
              github_url: parsedDetails.github_url || '',
              portfolio_url: parsedDetails.portfolio_url || '',
              objective: parsedDetails.objective || '',
            };
            // Set initial image preview if profile photo exists
            if (parsedDetails.profile_photo) {
              setImagePreview(parsedDetails.profile_photo);
            }
          }
        } catch (parseError) {
          console.error('JSON parse error for personal_details:', parseError, 'Raw data:', profile.personal_details);
        }
        setPersonalDetails(parsedDetails);

        let parsedEducation = [{ institution_name: '', degree: '', branch: '', start_year: '', end_year: '', grade: '' }];
        try {
          if (profile.education) {
            parsedEducation = typeof profile.education === 'string'
              ? JSON.parse(profile.education)
              : profile.education;
            if (!Array.isArray(parsedEducation) || parsedEducation.length === 0) {
              parsedEducation = [{ institution_name: '', degree: '', branch: '', start_year: '', end_year: '', grade: '' }];
            }
          }
        } catch (parseError) {
          console.error('JSON parse error for education:', parseError, 'Raw data:', profile.education);
        }
        setEducation(parsedEducation);

        let parsedSkills = [{ skill_name: '', proficiency_level: '' }];
        try {
          if (profile.skills) {
            parsedSkills = typeof profile.skills === 'string'
              ? JSON.parse(profile.skills)
              : profile.skills;
            if (!Array.isArray(parsedSkills)) {
              console.warn('Skills is not an array:', parsedSkills);
              parsedSkills = [{ skill_name: '', proficiency_level: '' }];
            } else if (parsedSkills.length === 0) {
              parsedSkills = [{ skill_name: '', proficiency_level: '' }];
            } else {
              parsedSkills = parsedSkills.map(skill => ({
                skill_name: skill.skill_name || '',
                proficiency_level: skill.proficiency_level || ''
              }));
            }
          }
        } catch (parseError) {
          console.error('JSON parse error for skills:', parseError, 'Raw data:', profile.skills);
          parsedSkills = [{ skill_name: '', proficiency_level: '' }];
        }
        setSkills(parsedSkills);

        let parsedWorkExperience = [{ company_name: '', role: '', start_date: '', end_date: '', is_current: false, description: '' }];
        try {
          if (profile.work_experience) {
            parsedWorkExperience = typeof profile.work_experience === 'string'
              ? JSON.parse(profile.work_experience)
              : profile.work_experience;
            if (!Array.isArray(parsedWorkExperience) || parsedWorkExperience.length === 0) {
              parsedWorkExperience = [{ company_name: '', role: '', start_date: '', end_date: '', is_current: false, description: '' }];
            }
          }
        } catch (parseError) {
          console.error('JSON parse error for work_experience:', parseError, 'Raw data:', profile.work_experience);
        }
        setWorkExperience(parsedWorkExperience);

        let parsedProjects = [{ project_title: '', technologies_used: '', description: '', project_link: '' }];
        try {
          if (profile.projects) {
            parsedProjects = typeof profile.projects === 'string'
              ? JSON.parse(profile.projects)
              : profile.projects;
            if (!Array.isArray(parsedProjects) || parsedProjects.length === 0) {
              parsedProjects = [{ project_title: '', technologies_used: '', description: '', project_link: '' }];
            }
          }
        } catch (parseError) {
          console.error('JSON parse error for projects:', parseError, 'Raw data:', profile.projects);
        }
        setProjects(parsedProjects);

        let parsedCertifications = [{ certificate_name: '', issuing_organization: '', issue_date: '', certificate_link: '' }];
        try {
          if (profile.certifications) {
            parsedCertifications = typeof profile.certifications === 'string'
              ? JSON.parse(profile.certifications)
              : profile.certifications;
            if (!Array.isArray(parsedCertifications) || parsedCertifications.length === 0) {
              parsedCertifications = [{ certificate_name: '', issuing_organization: '', issue_date: '', certificate_link: '' }];
            }
          }
        } catch (parseError) {
          console.error('JSON parse error for certifications:', parseError, 'Raw data:', profile.certifications);
        }
        setCertifications(parsedCertifications);

        let parsedAchievements = [{ title: '', description: '', date: '' }];
        try {
          if (profile.achievements) {
            parsedAchievements = typeof profile.achievements === 'string'
              ? JSON.parse(profile.achievements)
              : profile.achievements;
            if (!Array.isArray(parsedAchievements) || parsedAchievements.length === 0) {
              parsedAchievements = [{ title: '', description: '', date: '' }];
            }
          }
        } catch (parseError) {
          console.error('JSON parse error for achievements:', parseError, 'Raw data:', profile.achievements);
        }
        setAchievements(parsedAchievements);

        let parsedLanguages = [{ language_name: '', proficiency_level: '' }];
        try {
          if (profile.languages) {
            parsedLanguages = typeof profile.languages === 'string'
              ? JSON.parse(profile.languages)
              : profile.languages;
            if (!Array.isArray(parsedLanguages) || parsedLanguages.length === 0) {
              parsedLanguages = [{ language_name: '', proficiency_level: '' }];
            }
          }
        } catch (parseError) {
          console.error('JSON parse error for languages:', parseError, 'Raw data:', profile.languages);
        }
        setLanguages(parsedLanguages);

        let parsedHobbies = [{ hobby_name: '' }];
        try {
          if (profile.hobbies) {
            parsedHobbies = typeof profile.hobbies === 'string'
              ? JSON.parse(profile.hobbies)
              : profile.hobbies;
            if (!Array.isArray(parsedHobbies) || parsedHobbies.length === 0) {
              parsedHobbies = [{ hobby_name: '' }];
            }
          }
        } catch (parseError) {
          console.error('JSON parse error for hobbies:', parseError, 'Raw data:', profile.hobbies);
        }
        setHobbies(parsedHobbies);

        let parsedReferences = [{ reference_name: '', relation: '', contact_info: '' }];
        try {
          if (profile.resume_references) {
            parsedReferences = typeof profile.resume_references === 'string'
              ? JSON.parse(profile.resume_references)
              : profile.resume_references;
            if (!Array.isArray(parsedReferences) || parsedReferences.length === 0) {
              parsedReferences = [{ reference_name: '', relation: '', contact_info: '' }];
            }
          }
        } catch (parseError) {
          console.error('JSON parse error for resume_references:', parseError, 'Raw data:', profile.resume_references);
        }
        setReferences(parsedReferences);

      } catch (error) {
        console.error('Fetch profile error:', error);
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.id, user.name, user.email]);

  // Handle image selection with expo-image-picker
  const selectImage = async () => {
    if (!canEdit) {
      Alert.alert('Info', 'Profile editing is locked. Please raise a ticket to request changes.');
      return;
    }

    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Permission to access photo library is required.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // 1:1 aspect ratio for profile photo
        quality: 0.5, // 50% quality to help reduce size
        base64: true, // Include base64 data for upload
      });

      if (result.canceled) {
        console.log('User cancelled image picker');
        return;
      }

      const { base64, uri, type } = result.assets[0];
      
      // Calculate image size in KB (base64 string length * 0.75 gives approximate byte size)
      const imageSizeInKB = Math.round((base64.length * 0.75) / 1024);
      
      // Check if image size exceeds 50KB
      if (imageSizeInKB > 50) {
        Alert.alert(
          'Image Too Large', 
          `Selected image is ${imageSizeInKB}KB. Please select an image smaller than 50KB.`,
          [
            { 
              text: 'Try Again', 
              onPress: () => selectImage() 
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }
      
      // Image is within size limit
      const base64Image = `data:image/${type === 'image/jpeg' ? 'jpeg' : 'png'};base64,${base64}`;
      setPersonalDetails({ ...personalDetails, profile_photo: base64Image });
      setImagePreview(uri); // Use uri for preview (faster than base64)
      
      console.log(`Image selected successfully. Size: ${imageSizeInKB}KB`);
    } catch (error) {
      console.error('ImagePicker Error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const addEntry = (setter, defaultEntry) => {
    setter((prev) => [...prev, { ...defaultEntry }]);
  };

  const updateEntry = (setter, index, field, value) => {
    setter((prev) => {
      const newEntries = [...prev];
      newEntries[index][field] = value;
      return newEntries;
    });
  };

  const handleSubmit = async () => {
    if (!canEdit) {
      Alert.alert('Info', 'Profile editing is locked. Please raise a ticket to request changes.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const payload = {
        userId: user.id,
        profileData: {
          personal_details: personalDetails,
          education,
          skills,
          work_experience: workExperience,
          projects,
          certifications,
          achievements,
          languages,
          hobbies,
          resume_references: references,
        },
      };
      const response = await axios.post(
        `${API_BASE_URL}/api/profile/save`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Save response:', response.data);
      Alert.alert('Success', 'Profile saved successfully');
      setCanEdit(false);
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
      navigation.goBack();
    } catch (error) {
      console.error('Save profile error:', error, 'Response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);

    if (event.type === 'set' && currentDateField) {
      const formattedDate = currentDate.toISOString().split('T')[0];
      if (currentDateField.type === 'personal') {
        setPersonalDetails((prev) => ({ ...prev, [currentDateField.field]: formattedDate }));
      } else if (currentDateField.type === 'work') {
        updateEntry(setWorkExperience, currentDateField.index, currentDateField.field, formattedDate);
      } else if (currentDateField.type === 'certification') {
        updateEntry(setCertifications, currentDateField.index, currentDateField.field, formattedDate);
      } else if (currentDateField.type === 'achievement') {
        updateEntry(setAchievements, currentDateField.index, currentDateField.field, formattedDate);
      }
    }
  };

  const showDatepicker = (type, field, index = null) => {
    setCurrentDateField({ type, field, index });
    setShowDatePicker(true);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
          <Card style={styles.headerCard}>
            <Card.Content>
              <Title style={styles.headerTitle}>{canEdit ? 'Update Your Profile' : 'View Your Profile'}</Title>
              <Text style={styles.headerSubtitle}>
                {canEdit ? 'Personalize your details below' : 'Review your saved information'}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Personal Details */}
        <Card style={styles.card}>
          <Card.Content>
            <TouchableRipple onPress={() => toggleSection('personalDetails')}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <Icon name="person" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
                  <Title style={styles.sectionTitle}>Personal Details</Title>
                </View>
                <IconButton
                  icon={expandedSections.personalDetails ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableRipple>
            {expandedSections.personalDetails && (
              <View style={styles.sectionContent}>
                {canEdit ? (
                  <>
                    <View style={styles.imagePickerContainer}>
                      <Text style={styles.imageLabel}>Profile Photo (optional)</Text>
                      <Text style={styles.sizeWarning}>Upload size should be less than 50KB</Text>
                      {imagePreview ? (
                        <Image
                          source={{ uri: imagePreview }}
                          style={styles.imagePreview}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Icon name="person" size={50} color={theme.colors.placeholder} />
                          <Text style={styles.placeholderText}>No photo selected</Text>
                        </View>
                      )}
                      <Button
                        mode="contained"
                        onPress={selectImage}
                        style={styles.imageButton}
                        color={theme.colors.primary}
                      >
                        {imagePreview ? 'Change Photo' : 'Select Photo'}
                      </Button>
                    </View>
                    <TextInput
                      label="Full Name"
                      value={personalDetails.full_name}
                      style={styles.input}
                      mode="outlined"
                      disabled={true}
                      theme={{ colors: { primary: theme.colors.primary } }}
                    />
                    <TextInput
                      label="Email"
                      value={personalDetails.email}
                      style={styles.input}
                      mode="outlined"
                      keyboardType="email-address"
                      disabled={true}
                      theme={{ colors: { primary: theme.colors.primary } }}
                    />
                    <View style={styles.dateInputContainer}>
                      <TextInput
                        label="Date of Birth (YYYY-MM-DD)"
                        value={personalDetails.dob}
                        style={[styles.input, styles.dateInput]}
                        mode="outlined"
                        editable={false}
                        theme={{ colors: { primary: theme.colors.primary } }}
                      />
                      <Button
                        mode="contained"
                        onPress={() => showDatepicker('personal', 'dob')}
                        style={styles.dateButton}
                        color={theme.colors.primary}
                      >
                        Select
                      </Button>
                    </View>
                    <TextInput
                      label="Phone"
                      value={personalDetails.phone}
                      onChangeText={(text) => setPersonalDetails({ ...personalDetails, phone: text })}
                      style={styles.input}
                      mode="outlined"
                      keyboardType="phone-pad"
                      theme={{ colors: { primary: theme.colors.primary } }}
                    />
                    <TextInput
                      label="Address"
                      value={personalDetails.address}
                      onChangeText={(text) => setPersonalDetails({ ...personalDetails, address: text })}
                      style={styles.input}
                      mode="outlined"
                      multiline
                      numberOfLines={3}
                      theme={{ colors: { primary: theme.colors.primary } }}
                    />
                    <TextInput
                      label="Father's Name"
                      value={personalDetails.father_name}
                      onChangeText={(text) => setPersonalDetails({ ...personalDetails, father_name: text })}
                      style={styles.input}
                      mode="outlined"
                      theme={{ colors: { primary: theme.colors.primary } }}
                    />
                    <TextInput
                      label="Mother's Name"
                      value={personalDetails.mother_name}
                      onChangeText={(text) => setPersonalDetails({ ...personalDetails, mother_name: text })}
                      style={styles.input}
                      mode="outlined"
                      theme={{ colors: { primary: theme.colors.primary } }}
                    />
                    <TextInput
                      label="LinkedIn URL (optional)"
                      value={personalDetails.linkedin_url}
                      onChangeText={(text) => setPersonalDetails({ ...personalDetails, linkedin_url: text })}
                      style={styles.input}
                      mode="outlined"
                      theme={{ colors: { primary: theme.colors.primary } }}
                    />
                    <TextInput
                      label="GitHub URL (optional)"
                      value={personalDetails.github_url}
                      onChangeText={(text) => setPersonalDetails({ ...personalDetails, github_url: text })}
                      style={styles.input}
                      mode="outlined"
                      theme={{ colors: { primary: theme.colors.primary } }}
                    />
                    <TextInput
                      label="Portfolio URL (optional)"
                      value={personalDetails.portfolio_url}
                      onChangeText={(text) => setPersonalDetails({ ...personalDetails, portfolio_url: text })}
                      style={styles.input}
                      mode="outlined"
                      theme={{ colors: { primary: theme.colors.primary } }}
                    />
                    <TextInput
                      label="Objective/Summary"
                      value={personalDetails.objective}
                      onChangeText={(text) => setPersonalDetails({ ...personalDetails, objective: text })}
                      style={styles.input}
                      mode="outlined"
                      multiline
                      numberOfLines={4}
                      theme={{ colors: { primary: theme.colors.primary } }}
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.imagePickerContainer}>
                      <Text style={styles.imageLabel}>Profile Photo</Text>
                      {personalDetails.profile_photo ? (
                        <Image
                          source={{ uri: personalDetails.profile_photo }}
                          style={styles.imagePreview}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Icon name="person" size={50} color={theme.colors.placeholder} />
                          <Text style={styles.placeholderText}>No photo available</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.viewText}>Full Name: {personalDetails.full_name || 'N/A'}</Text>
                    <Text style={styles.viewText}>Email: {personalDetails.email}</Text>
                    <Text style={styles.viewText}>Date of Birth: {personalDetails.dob || 'N/A'}</Text>
                    <Text style={styles.viewText}>Phone: {personalDetails.phone || 'N/A'}</Text>
                    <Text style={styles.viewText}>Address: {personalDetails.address || 'N/A'}</Text>
                    <Text style={styles.viewText}>Father's Name: {personalDetails.father_name || 'N/A'}</Text>
                    <Text style={styles.viewText}>Mother's Name: {personalDetails.mother_name || 'N/A'}</Text>
                    <Text style={styles.viewText}>LinkedIn URL: {personalDetails.linkedin_url || 'N/A'}</Text>
                    <Text style={styles.viewText}>GitHub URL: {personalDetails.github_url || 'N/A'}</Text>
                    <Text style={styles.viewText}>Portfolio URL: {personalDetails.portfolio_url || 'N/A'}</Text>
                    <Text style={styles.viewText}>Objective/Summary: {personalDetails.objective || 'N/A'}</Text>
                  </>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Education */}
        <Card style={styles.card}>
          <Card.Content>
            <TouchableRipple onPress={() => toggleSection('education')}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <Icon name="school" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
                  <Title style={styles.sectionTitle}>Education</Title>
                </View>
                <IconButton
                  icon={expandedSections.education ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableRipple>
            {expandedSections.education && (
              <View style={styles.sectionContent}>
                {canEdit ? (
                  <>
                    {education.map((edu, index) => (
                      <View key={index} style={styles.entry}>
                        <TextInput
                          label="Institution Name"
                          value={edu.institution_name}
                          onChangeText={(text) => updateEntry(setEducation, index, 'institution_name', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="Degree"
                          value={edu.degree}
                          onChangeText={(text) => updateEntry(setEducation, index, 'degree', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="Branch/Major"
                          value={edu.branch}
                          onChangeText={(text) => updateEntry(setEducation, index, 'branch', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="Start Year"
                          value={edu.start_year}
                          onChangeText={(text) => updateEntry(setEducation, index, 'start_year', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="End Year"
                          value={edu.end_year}
                          onChangeText={(text) => updateEntry(setEducation, index, 'end_year', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="Grade/Percentage"
                          value={edu.grade}
                          onChangeText={(text) => updateEntry(setEducation, index, 'grade', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                      </View>
                    ))}
                    <Button
                      mode="outlined"
                      onPress={() => addEntry(setEducation, { institution_name: '', degree: '', branch: '', start_year: '', end_year: '', grade: '' })}
                      style={styles.addButton}
                      color={theme.colors.primary}
                    >
                      Add Education
                    </Button>
                  </>
                ) : (
                  education.map((edu, index) => (
                    <View key={index} style={styles.entry}>
                      <Text style={styles.viewText}>Institution: {edu.institution_name || 'N/A'}</Text>
                      <Text style={styles.viewText}>Degree: {edu.degree || 'N/A'}</Text>
                      <Text style={styles.viewText}>Branch: {edu.branch || 'N/A'}</Text>
                      <Text style={styles.viewText}>Start Year: {edu.start_year || 'N/A'}</Text>
                      <Text style={styles.viewText}>End Year: {edu.end_year || 'N/A'}</Text>
                      <Text style={styles.viewText}>Grade: {edu.grade || 'N/A'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Skills */}
        <Card style={styles.card}>
          <Card.Content>
            <TouchableRipple onPress={() => toggleSection('skills')}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <Icon name="star" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
                  <Title style={styles.sectionTitle}>Skills</Title>
                </View>
                <IconButton
                  icon={expandedSections.skills ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableRipple>
            {expandedSections.skills && (
              <View style={styles.sectionContent}>
                {canEdit ? (
                  <>
                    {skills.map((skill, index) => (
                      <View key={index} style={styles.entry}>
                        <TextInput
                          label="Skill Name"
                          value={skill.skill_name}
                          onChangeText={(text) => updateEntry(setSkills, index, 'skill_name', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={skill.proficiency_level}
                            onValueChange={(value) => updateEntry(setSkills, index, 'proficiency_level', value)}
                            style={styles.picker}
                          >
                            <Picker.Item label="Select Proficiency" value="" />
                            <Picker.Item label="Beginner" value="beginner" />
                            <Picker.Item label="Intermediate" value="intermediate" />
                            <Picker.Item label="Expert" value="expert" />
                          </Picker>
                        </View>
                      </View>
                    ))}
                    <Button
                      mode="outlined"
                      onPress={() => addEntry(setSkills, { skill_name: '', proficiency_level: '' })}
                      style={styles.addButton}
                      color={theme.colors.primary}
                    >
                      Add Skill
                    </Button>
                  </>
                ) : (
                  skills.map((skill, index) => (
                    <View key={index} style={styles.entry}>
                      <Text style={styles.viewText}>Skill: {skill.skill_name || 'N/A'}</Text>
                      <Text style={styles.viewText}>Proficiency: {skill.proficiency_level || 'N/A'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Work Experience */}
        <Card style={styles.card}>
          <Card.Content>
            <TouchableRipple onPress={() => toggleSection('workExperience')}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <Icon name="work" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
                  <Title style={styles.sectionTitle}>Experience/Internships</Title>
                </View>
                <IconButton
                  icon={expandedSections.workExperience ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableRipple>
            {expandedSections.workExperience && (
              <View style={styles.sectionContent}>
                {canEdit ? (
                  <>
                    {workExperience.map((exp, index) => (
                      <View key={index} style={styles.entry}>
                        <TextInput
                          label="Company Name"
                          value={exp.company_name}
                          onChangeText={(text) => updateEntry(setWorkExperience, index, 'company_name', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="Role/Designation"
                          value={exp.role}
                          onChangeText={(text) => updateEntry(setWorkExperience, index, 'role', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <View style={styles.dateInputContainer}>
                          <TextInput
                            label="Start Date (YYYY-MM-DD)"
                            value={exp.start_date}
                            style={[styles.input, styles.dateInput]}
                            mode="outlined"
                            editable={false}
                            theme={{ colors: { primary: theme.colors.primary } }}
                          />
                          <Button
                            mode="contained"
                            onPress={() => showDatepicker('work', 'start_date', index)}
                            style={styles.dateButton}
                            color={theme.colors.primary}
                          >
                            Select
                          </Button>
                        </View>
                        <View style={styles.dateInputContainer}>
                          <TextInput
                            label="End Date (YYYY-MM-DD)"
                            value={exp.end_date}
                            style={[styles.input, styles.dateInput]}
                            mode="outlined"
                            editable={false}
                            disabled={exp.is_current}
                            theme={{ colors: { primary: theme.colors.primary } }}
                          />
                          <Button
                            mode="contained"
                            onPress={() => showDatepicker('work', 'end_date', index)}
                            style={styles.dateButton}
                            disabled={exp.is_current}
                            color={theme.colors.primary}
                          >
                            Select
                          </Button>
                        </View>
                        <View style={styles.checkboxContainer}>
                          <Checkbox
                            status={exp.is_current ? 'checked' : 'unchecked'}
                            onPress={() => {
                              updateEntry(setWorkExperience, index, 'is_current', !exp.is_current);
                              if (!exp.is_current) {
                                updateEntry(setWorkExperience, index, 'end_date', '');
                              }
                            }}
                            color={theme.colors.primary}
                          />
                          <Text style={styles.checkboxLabel}>Is Current</Text>
                        </View>
                        <TextInput
                          label="Description"
                          value={exp.description}
                          onChangeText={(text) => updateEntry(setWorkExperience, index, 'description', text)}
                          style={styles.input}
                          mode="outlined"
                          multiline
                          numberOfLines={3}
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                      </View>
                    ))}
                    <Button
                      mode="outlined"
                      onPress={() => addEntry(setWorkExperience, { company_name: '', role: '', start_date: '', end_date: '', is_current: false, description: '' })}
                      style={styles.addButton}
                      color={theme.colors.primary}
                    >
                      Add Work Experience
                    </Button>
                  </>
                ) : (
                  workExperience.map((exp, index) => (
                    <View key={index} style={styles.entry}>
                      <Text style={styles.viewText}>Company: {exp.company_name || 'N/A'}</Text>
                      <Text style={styles.viewText}>Role: {exp.role || 'N/A'}</Text>
                      <Text style={styles.viewText}>Start Date: {exp.start_date || 'N/A'}</Text>
                      <Text style={styles.viewText}>End Date: {exp.is_current ? 'Current' : exp.end_date || 'N/A'}</Text>
                      <Text style={styles.viewText}>Description: {exp.description || 'N/A'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Projects */}
        <Card style={styles.card}>
          <Card.Content>
            <TouchableRipple onPress={() => toggleSection('projects')}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <Icon name="code" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
                  <Title style={styles.sectionTitle}>Projects</Title>
                </View>
                <IconButton
                  icon={expandedSections.projects ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableRipple>
            {expandedSections.projects && (
              <View style={styles.sectionContent}>
                {canEdit ? (
                  <>
                    {projects.map((proj, index) => (
                      <View key={index} style={styles.entry}>
                        <TextInput
                          label="Project Title"
                          value={proj.project_title}
                          onChangeText={(text) => updateEntry(setProjects, index, 'project_title', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="Technologies Used"
                          value={proj.technologies_used}
                          onChangeText={(text) => updateEntry(setProjects, index, 'technologies_used', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="Description"
                          value={proj.description}
                          onChangeText={(text) => updateEntry(setProjects, index, 'description', text)}
                          style={styles.input}
                          mode="outlined"
                          multiline
                          numberOfLines={3}
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="Project Link (optional)"
                          value={proj.project_link}
                          onChangeText={(text) => updateEntry(setProjects, index, 'project_link', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                      </View>
                    ))}
                    <Button
                      mode="outlined"
                      onPress={() => addEntry(setProjects, { project_title: '', technologies_used: '', description: '', project_link: '' })}
                      style={styles.addButton}
                      color={theme.colors.primary}
                    >
                      Add Project
                    </Button>
                  </>
                ) : (
                  projects.map((proj, index) => (
                    <View key={index} style={styles.entry}>
                      <Text style={styles.viewText}>Title: {proj.project_title || 'N/A'}</Text>
                      <Text style={styles.viewText}>Technologies: {proj.technologies_used || 'N/A'}</Text>
                      <Text style={styles.viewText}>Description: {proj.description || 'N/A'}</Text>
                      <Text style={styles.viewText}>Link: {proj.project_link || 'N/A'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Certifications */}
        <Card style={styles.card}>
          <Card.Content>
            <TouchableRipple onPress={() => toggleSection('certifications')}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <Icon name="verified" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
                  <Title style={styles.sectionTitle}>Certifications</Title>
                </View>
                <IconButton
                  icon={expandedSections.certifications ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableRipple>
            {expandedSections.certifications && (
              <View style={styles.sectionContent}>
                {canEdit ? (
                  <>
                    {certifications.map((cert, index) => (
                      <View key={index} style={styles.entry}>
                        <TextInput
                          label="Certificate Name"
                          value={cert.certificate_name}
                          onChangeText={(text) => updateEntry(setCertifications, index, 'certificate_name', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="Issuing Organization"
                          value={cert.issuing_organization}
                          onChangeText={(text) => updateEntry(setCertifications, index, 'issuing_organization', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <View style={styles.dateInputContainer}>
                          <TextInput
                            label="Issue Date (YYYY-MM-DD)"
                            value={cert.issue_date}
                            style={[styles.input, styles.dateInput]}
                            mode="outlined"
                            editable={false}
                            theme={{ colors: { primary: theme.colors.primary } }}
                          />
                          <Button
                            mode="contained"
                            onPress={() => showDatepicker('certification', 'issue_date', index)}
                            style={styles.dateButton}
                            color={theme.colors.primary}
                          >
                            Select
                          </Button>
                        </View>
                        <TextInput
                          label="Certificate Link (optional)"
                          value={cert.certificate_link}
                          onChangeText={(text) => updateEntry(setCertifications, index, 'certificate_link', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                      </View>
                    ))}
                    <Button
                      mode="outlined"
                      onPress={() => addEntry(setCertifications, { certificate_name: '', issuing_organization: '', issue_date: '', certificate_link: '' })}
                      style={styles.addButton}
                      color={theme.colors.primary}
                    >
                      Add Certification
                    </Button>
                  </>
                ) : (
                  certifications.map((cert, index) => (
                    <View key={index} style={styles.entry}>
                      <Text style={styles.viewText}>Certificate: {cert.certificate_name || 'N/A'}</Text>
                      <Text style={styles.viewText}>Organization: {cert.issuing_organization || 'N/A'}</Text>
                      <Text style={styles.viewText}>Issue Date: {cert.issue_date || 'N/A'}</Text>
                      <Text style={styles.viewText}>Link: {cert.certificate_link || 'N/A'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Achievements */}
        <Card style={styles.card}>
          <Card.Content>
            <TouchableRipple onPress={() => toggleSection('achievements')}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <Icon name="emoji-events" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
                  <Title style={styles.sectionTitle}>Achievements/Awards</Title>
                </View>
                <IconButton
                  icon={expandedSections.achievements ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableRipple>
            {expandedSections.achievements && (
              <View style={styles.sectionContent}>
                {canEdit ? (
                  <>
                    {achievements.map((ach, index) => (
                      <View key={index} style={styles.entry}>
                        <TextInput
                          label="Title"
                          value={ach.title}
                          onChangeText={(text) => updateEntry(setAchievements, index, 'title', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="Description"
                          value={ach.description}
                          onChangeText={(text) => updateEntry(setAchievements, index, 'description', text)}
                          style={styles.input}
                          mode="outlined"
                          multiline
                          numberOfLines={3}
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <View style={styles.dateInputContainer}>
                          <TextInput
                            label="Date (optional)"
                            value={ach.date}
                            style={[styles.input, styles.dateInput]}
                            mode="outlined"
                            editable={false}
                            theme={{ colors: { primary: theme.colors.primary } }}
                          />
                          <Button
                            mode="contained"
                            onPress={() => showDatepicker('achievement', 'date', index)}
                            style={styles.dateButton}
                            color={theme.colors.primary}
                          >
                            Select
                          </Button>
                        </View>
                      </View>
                    ))}
                    <Button
                      mode="outlined"
                      onPress={() => addEntry(setAchievements, { title: '', description: '', date: '' })}
                      style={styles.addButton}
                      color={theme.colors.primary}
                    >
                      Add Achievement
                    </Button>
                  </>
                ) : (
                  achievements.map((ach, index) => (
                    <View key={index} style={styles.entry}>
                      <Text style={styles.viewText}>Title: {ach.title || 'N/A'}</Text>
                      <Text style={styles.viewText}>Description: {ach.description || 'N/A'}</Text>
                      <Text style={styles.viewText}>Date: {ach.date || 'N/A'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Languages */}
        <Card style={styles.card}>
          <Card.Content>
            <TouchableRipple onPress={() => toggleSection('languages')}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <Icon name="language" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
                  <Title style={styles.sectionTitle}>Languages Known</Title>
                </View>
                <IconButton
                  icon={expandedSections.languages ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableRipple>
            {expandedSections.languages && (
              <View style={styles.sectionContent}>
                {canEdit ? (
                  <>
                    {languages.map((lang, index) => (
                      <View key={index} style={styles.entry}>
                        <TextInput
                          label="Language Name"
                          value={lang.language_name}
                          onChangeText={(text) => updateEntry(setLanguages, index, 'language_name', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={lang.proficiency_level}
                            onValueChange={(value) => updateEntry(setLanguages, index, 'proficiency_level', value)}
                            style={styles.picker}
                          >
                            <Picker.Item label="Select Proficiency" value="" />
                            <Picker.Item label="Beginner" value="beginner" />
                            <Picker.Item label="Intermediate" value="intermediate" />
                            <Picker.Item label="Expert" value="expert" />
                          </Picker>
                        </View>
                      </View>
                    ))}
                    <Button
                      mode="outlined"
                      onPress={() => addEntry(setLanguages, { language_name: '', proficiency_level: '' })}
                      style={styles.addButton}
                      color={theme.colors.primary}
                    >
                      Add Language
                    </Button>
                  </>
                ) : (
                  languages.map((lang, index) => (
                    <View key={index} style={styles.entry}>
                      <Text style={styles.viewText}>Language: {lang.language_name || 'N/A'}</Text>
                      <Text style={styles.viewText}>Proficiency: {lang.proficiency_level || 'N/A'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Hobbies */}
        <Card style={styles.card}>
          <Card.Content>
            <TouchableRipple onPress={() => toggleSection('hobbies')}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <Icon name="favorite" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
                  <Title style={styles.sectionTitle}>Hobbies/Interests</Title>
                </View>
                <IconButton
                  icon={expandedSections.hobbies ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableRipple>
            {expandedSections.hobbies && (
              <View style={styles.sectionContent}>
                {canEdit ? (
                  <>
                    {hobbies.map((hobby, index) => (
                      <View key={index} style={styles.entry}>
                        <TextInput
                          label="Hobby/Interest"
                          value={hobby.hobby_name}
                          onChangeText={(text) => updateEntry(setHobbies, index, 'hobby_name', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                      </View>
                    ))}
                    <Button
                      mode="outlined"
                      onPress={() => addEntry(setHobbies, { hobby_name: '' })}
                      style={styles.addButton}
                      color={theme.colors.primary}
                    >
                      Add Hobby
                    </Button>
                  </>
                ) : (
                  hobbies.map((hobby, index) => (
                    <View key={index} style={styles.entry}>
                      <Text style={styles.viewText}>Hobby: {hobby.hobby_name || 'N/A'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* References */}
        <Card style={styles.card}>
          <Card.Content>
            <TouchableRipple onPress={() => toggleSection('references')}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <Icon name="contacts" size={20} color={theme.colors.primary} style={styles.sectionIcon} />
                  <Title style={styles.sectionTitle}>References (optional)</Title>
                </View>
                <IconButton
                  icon={expandedSections.references ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableRipple>
            {expandedSections.references && (
              <View style={styles.sectionContent}>
                {canEdit ? (
                  <>
                    {references.map((ref, index) => (
                      <View key={index} style={styles.entry}>
                        <TextInput
                          label="Reference Name"
                          value={ref.reference_name}
                          onChangeText={(text) => updateEntry(setReferences, index, 'reference_name', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="Relation"
                          value={ref.relation}
                          onChangeText={(text) => updateEntry(setReferences, index, 'relation', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                        <TextInput
                          label="Contact Info"
                          value={ref.contact_info}
                          onChangeText={(text) => updateEntry(setReferences, index, 'contact_info', text)}
                          style={styles.input}
                          mode="outlined"
                          theme={{ colors: { primary: theme.colors.primary } }}
                        />
                      </View>
                    ))}
                    <Button
                      mode="outlined"
                      onPress={() => addEntry(setReferences, { reference_name: '', relation: '', contact_info: '' })}
                      style={styles.addButton}
                      color={theme.colors.primary}
                    >
                      Add Reference
                    </Button>
                  </>
                ) : (
                  references.map((ref, index) => (
                    <View key={index} style={styles.entry}>
                      <Text style={styles.viewText}>Name: {ref.reference_name || 'N/A'}</Text>
                      <Text style={styles.viewText}>Relation: {ref.relation || 'N/A'}</Text>
                      <Text style={styles.viewText}>Contact: {ref.contact_info || 'N/A'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {canEdit ? (
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
            disabled={loading}
            color={theme.colors.primary}
            contentStyle={styles.submitButtonContent}
          >
            Save Profile
          </Button>
        ) : (
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.submitButton}
            color={theme.colors.primary}
            contentStyle={styles.submitButtonContent}
          >
            Back
          </Button>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    marginTop: 10,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    letterSpacing: 0.25,
  },
  card: {
    marginBottom: 8,
    elevation: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sectionContent: {
    padding: 12,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    fontSize: 14,
  },
  entry: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButton: {
    marginTop: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 2,
  },
  submitButton: {
    marginVertical: 20,
    borderRadius: 8,
    alignSelf: 'center',
    width: '50%',
    marginBottom: 40,
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
    marginRight: 8,
  },
  dateButton: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  picker: {
    height: 40,
    color: theme.colors.text,
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.placeholder,
  },
  viewText: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 6,
    color: theme.colors.text,
    lineHeight: 20,
  },
  imagePickerContainer: {
    marginBottom: 12,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginBottom: 4,
  },
  sizeWarning: {
    fontSize: 12,
    color: '#F59E0B',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeholderText: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 8,
  },
  imageButton: {
    borderRadius: 6,
    paddingVertical: 2,
  },
});