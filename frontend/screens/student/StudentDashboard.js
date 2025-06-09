import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, SafeAreaView, TouchableOpacity, RefreshControl, Linking } from 'react-native';
import { Text, Button, Card, TextInput, IconButton, Title, ActivityIndicator, Dialog, Portal, Paragraph } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0288D1',
    accent: '#4FC3F7',
    background: '#E3F2FD',
    text: '#212121',
    secondaryText: '#757575',
    placeholder: '#757575',
    surface: '#FFFFFF',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#EF5350',
  },
};

const Tab = createBottomTabNavigator();

// Animated Task Card Component
const AnimatedTaskCard = ({ item, index, onUpdateTask }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const [isExpanded, setIsExpanded] = useState(false);
  const [updateDialogVisible, setUpdateDialogVisible] = useState(false);
  const [status, setStatus] = useState(item.status || 'pending');
  const [notes, setNotes] = useState(item.notes || '');
  const [link, setLink] = useState(item.link || '');

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
      delay: index * 100,
    });
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.ease),
      delay: index * 100,
    });
  }, [opacity, translateY, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return { color: theme.colors.secondaryText, status: 'N/A' };
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { color: theme.colors.error, status: 'Overdue' };
    if (diffDays <= 2) return { color: theme.colors.warning, status: 'Due Soon' };
    return { color: theme.colors.success, status: 'On Track' };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'in_progress':
        return theme.colors.warning;
      case 'pending':
        return theme.colors.secondaryText;
      default:
        return theme.colors.secondaryText;
    }
  };

  const dueDateStatus = getDueDateStatus(item.due_date);

  const handleUpdateTask = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = { status, notes, link };

      await axios.post(
        `${API_BASE_URL}/api/tasks/update/${item.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      Alert.alert('Success', 'Task updated successfully');
      setUpdateDialogVisible(false);
      onUpdateTask();
    } catch (error) {
      console.error('Update task error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update task');
    }
  };

  return (
    <>
      <Animated.View style={[styles.taskCardContainer, animatedStyle]}>
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <Card style={[styles.taskCard, { borderLeftColor: dueDateStatus.color }]}>
            <Card.Content>
              <View style={styles.taskCardHeader}>
                <Title style={styles.taskTitle}>{item.task}</Title>
                <View style={[styles.statusDot, { backgroundColor: dueDateStatus.color }]} />
              </View>
              <Text style={[styles.taskDetail, { color: dueDateStatus.color }]}>
                Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'} ({dueDateStatus.status})
              </Text>
              <Text style={[styles.taskDetail, { color: getStatusColor(item.status) }]}>
                Status: {item.status || 'Pending'}
              </Text>
              {isExpanded && (
                <>
                  {item.notes && (
                    <Text style={styles.taskDetail}>Notes: {item.notes}</Text>
                  )}
                  {item.link && (
                    <Text
                      style={[styles.taskDetail, { color: theme.colors.primary, textDecorationLine: 'underline' }]}
                      onPress={() => Linking.openURL(item.link)}
                    >
                      Link: {item.link}
                    </Text>
                  )}
                  <Button
                    mode="outlined"
                    onPress={() => setUpdateDialogVisible(true)}
                    style={styles.updateButton}
                    labelStyle={styles.updateButtonLabel}
                    icon="pencil"
                  >
                    Update Task
                  </Button>
                </>
              )}
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </Animated.View>
      <Portal>
        <Dialog visible={updateDialogVisible} onDismiss={() => setUpdateDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Update Task</Dialog.Title>
          <Dialog.Content>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Status</Text>
              <View style={styles.pickerBorder}>
                <Picker
                  selectedValue={status}
                  onValueChange={(value) => setStatus(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Pending" value="pending" />
                  <Picker.Item label="In Progress" value="in_progress" />
                  <Picker.Item label="Completed" value="completed" />
                </Picker>
              </View>
            </View>
            <TextInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
              theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
            />
            <TextInput
              label="Link (e.g., https://example.com)"
              value={link}
              onChangeText={setLink}
              style={styles.input}
              mode="outlined"
              theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setUpdateDialogVisible(false)} textColor={theme.colors.secondaryText}>
              Cancel
            </Button>
            <Button onPress={handleUpdateTask} textColor={theme.colors.primary}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

// Animated Ticket Card Component
const AnimatedTicketCard = ({ item, index }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
      delay: index * 100,
    });
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.ease),
      delay: index * 100,
    });
  }, [opacity, translateY, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return theme.colors.success;
      case 'declined':
        return theme.colors.error;
      case 'pending':
        return theme.colors.warning;
      default:
        return theme.colors.secondaryText;
    }
  };

  return (
    <Animated.View style={[styles.taskCardContainer, animatedStyle]}>
      <Card style={[styles.taskCard, { borderLeftColor: getStatusColor(item.status) }]}>
        <Card.Content>
          <View style={styles.taskCardHeader}>
            <Title style={styles.taskTitle}>Ticket #{item.id}</Title>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          </View>
          <Text style={styles.taskDetail}>Description: {item.description}</Text>
          <Text style={[styles.taskDetail, { color: getStatusColor(item.status) }]}>Status: {item.status}</Text>
          {item.response && (
            <Text style={styles.taskDetail}>Response: {item.response}</Text>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

// Home Screen: Displays welcome message, metrics, and generate resume action
function HomeScreen({ user, navigation, tasks, onTasksUpdated }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/tickets/student/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Fetch tickets error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await onTasksUpdated();
  };

  useEffect(() => {
    fetchData();

    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
  }, [user.id, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Calculate metrics
  const pendingTickets = tickets.filter(ticket => ticket.status === 'pending').length;
  const totalTickets = tickets.length;
  const upcomingTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7; // Due within a week
  }).length;
  const overdueTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    return dueDate < today;
  }).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.innerContainer}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeHeader}>
              <Icon name="account-circle" size={48} color={theme.colors.primary} />
              <View>
                <Title style={styles.welcomeTitle}>Welcome, {user.name}!</Title>
                <Text style={styles.welcomeSubtitle}>{user.branch} Branch</Text>
              </View>
            </View>
            <Text style={styles.welcomeText}>
              Create a professional resume tailored to your profile.
            </Text>
          </Card.Content>
        </Card>

        {loading ? (
          <ActivityIndicator animating={true} size="large" color={theme.colors.primary} style={styles.loader} />
        ) : (
          <Animated.View style={[styles.metricsContainer, animatedStyle]}>
            <Title style={styles.metricsTitle}>Your Dashboard</Title>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Icon name="ticket-confirmation" size={32} color="#FFD166" />
                <Text style={styles.metricValue}>{pendingTickets}</Text>
                <Text style={styles.metricLabel}>Pending Tickets</Text>
              </View>
              <View style={styles.metricCard}>
                <Icon name="ticket" size={32} color="#F18F01" />
                <Text style={styles.metricValue}>{totalTickets}</Text>
                <Text style={styles.metricLabel}>Total Tickets</Text>
              </View>
              <View style={styles.metricCard}>
                <Icon name="calendar-clock" size={32} color="#4ECDC4" />
                <Text style={styles.metricValue}>{upcomingTasks}</Text>
                <Text style={styles.metricLabel}>Upcoming Tasks</Text>
              </View>
              <View style={styles.metricCard}>
                <Icon name="calendar-alert" size={32} color="#FF6B6B" />
                <Text style={styles.metricValue}>{overdueTasks}</Text>
                <Text style={styles.metricLabel}>Overdue Tasks</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <Card style={styles.resumeBannerCard}>
          <View style={styles.resumeBannerGradient}>
            <View style={styles.resumeBannerContent}>
              <View style={styles.resumeBannerTextContainer}>
                <View style={styles.resumeTitleContainer}>
                  <Icon name="star" size={20} color="#FFD700" style={styles.resumeTitleIcon} />
                  <Title style={styles.resumeBannerTitle}>Professional Resume Builder</Title>
                </View>
                <Text style={styles.resumeBannerText}>
                  Create a tailored resume that highlights your skills and achievements. Stand out to potential employers!
                </Text>
                <View style={styles.resumeFeatures}>
                  <View style={styles.resumeFeatureItem}>
                    <Icon name="check-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.resumeFeatureText}>Professional Templates</Text>
                  </View>
                  <View style={styles.resumeFeatureItem}>
                    <Icon name="check-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.resumeFeatureText}>ATS-Friendly Format</Text>
                  </View>
                  <View style={styles.resumeFeatureItem}>
                    <Icon name="check-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.resumeFeatureText}>Instant Download</Text>
                  </View>
                </View>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('ResumeTemplate', { user })}
                  style={styles.resumeButton}
                  labelStyle={styles.resumeButtonLabel}
                  icon="file-document-outline"
                >
                  Generate Resume
                </Button>
              </View>
              <View style={styles.resumeImageContainer}>
                <View style={styles.resumeImageBackground}>
                  <Icon name="file-document-edit-outline" size={80} color={theme.colors.primary} style={styles.resumeBannerIcon} />
                </View>
                <View style={styles.resumeBadge}>
                  <Text style={styles.resumeBadgeText}>NEW</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

// Tickets Screen: View and raise tickets
function TicketsScreen({ user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleTickets, setVisibleTickets] = useState(5);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleTickets(prev => prev + 5);
      setLoadingMore(false);
    }, 500);
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/tickets/student/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTickets(response.data.tickets || []);
      } catch (error) {
        console.error('Fetch tickets error:', error);
        Alert.alert('Error', 'Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [user.id]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Your Tickets</Title>
        </View>
        {loading ? (
          <ActivityIndicator animating={true} size="large" color={theme.colors.primary} style={styles.loader} />
        ) : tickets.length === 0 ? (
          <Text style={styles.noDataText}>No tickets found.</Text>
        ) : (
          <>
            {tickets.slice(0, visibleTickets).map((item, index) => (
              <AnimatedTicketCard key={`ticket-${item.id}`} item={item} index={index} />
            ))}

            {visibleTickets < tickets.length && (
              <View style={styles.loadMoreContainer}>
                <Button
                  mode="outlined"
                  onPress={loadMore}
                  loading={loadingMore}
                  style={styles.loadMoreButton}
                  labelStyle={styles.loadMoreButtonLabel}
                  icon="chevron-down"
                >
                  Load More
                </Button>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

// Tasks Screen: List of tasks assigned to the student
function TasksScreen({ tasks, onTasksUpdated }) {
  const [visibleTasks, setVisibleTasks] = useState(5);
  const [loadingMore, setLoadingMore] = useState(false);

  const sortTasksByDueDate = (tasks) => {
    return [...tasks].sort((a, b) => {
      const dateA = a.due_date ? new Date(a.due_date) : null;
      const dateB = b.due_date ? new Date(b.due_date) : null;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB - dateA;
    });
  };

  const loadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleTasks(prev => prev + 5);
      setLoadingMore(false);
    }, 500);
  };

  const sortedTasks = sortTasksByDueDate(tasks);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <Title style={styles.sectionTitle}>Your Tasks</Title>
        {sortedTasks.length === 0 ? (
          <Text style={styles.noDataText}>No tasks assigned to you.</Text>
        ) : (
          <>
            {sortedTasks.slice(0, visibleTasks).map((item, index) => (
              <AnimatedTaskCard
                key={`task-${item.id}`}
                item={item}
                index={index}
                onUpdateTask={onTasksUpdated}
              />
            ))}

            {visibleTasks < sortedTasks.length && (
              <View style={styles.loadMoreContainer}>
                <Button
                  mode="outlined"
                  onPress={loadMore}
                  loading={loadingMore}
                  style={styles.loadMoreButton}
                  labelStyle={styles.loadMoreButtonLabel}
                  icon="chevron-down"
                >
                  Load More
                </Button>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

// Profile Screen: Display options based on profile data existence
function ProfileScreen({ user, navigation, onProfileUpdated }) {
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [expanded, setExpanded] = useState(null); // 'profile', 'help', or 'privacy'
  const [hasPendingTickets, setHasPendingTickets] = useState(false);

  const toggleSection = (section) => {
    setExpanded(expanded === section ? null : section);
  };

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = response.data.profile;
      setCanEdit(response.data.can_edit_profile);

      // Check if profile data exists (personal_details to resume_references)
      const hasProfileData = profile.personal_details && (
        profile.education ||
        profile.skills ||
        profile.work_experience ||
        profile.projects ||
        profile.certifications ||
        profile.achievements ||
        profile.languages ||
        profile.hobbies ||
        profile.resume_references
      );
      setProfileExists(!!hasProfileData);
    } catch (error) {
      console.error('Fetch profile error:', error);
      Alert.alert('Error', 'Failed to load profile status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const checkPendingTickets = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/tickets/student/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Check if there are any pending tickets
      const pendingTickets = response.data.tickets?.filter(ticket => ticket.status === 'pending') || [];
      setHasPendingTickets(pendingTickets.length > 0);
    } catch (error) {
      console.error('Check pending tickets error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    await checkPendingTickets();
  };

  useEffect(() => {
    fetchProfile();
    checkPendingTickets();
  }, [user.id]);

  const handleRaiseTicket = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/tickets`,
        { user_id: user.id, description: 'Request to edit profile' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Ticket raised successfully. Please wait for admin approval.');
      // Refresh ticket status after raising a new ticket
      await checkPendingTickets();
    } catch (error) {
      console.error('Raise ticket error:', error);
      Alert.alert('Error', 'Failed to raise ticket');
    }
  };

  // Student Profile Section Component
  const StudentProfileSection = () => {
    return (
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
            <Icon name="account" size={24} color={theme.colors.primary} style={{marginRight: 10}} />
            <Title style={styles.sectionTitle}>Student Profile</Title>
          </View>

          <View style={styles.profileRow}>
            <Icon name="account" size={20} color={theme.colors.primary} style={styles.profileIcon} />
            <Text style={styles.profileText}>Name: {user.name}</Text>
          </View>
          <View style={styles.profileRow}>
            <Icon name="email" size={20} color={theme.colors.primary} style={styles.profileIcon} />
            <Text style={styles.profileText}>Email: {user.email}</Text>
          </View>
          <View style={styles.profileRow}>
            <Icon name="school" size={20} color={theme.colors.primary} style={styles.profileIcon} />
            <Text style={styles.profileText}>Branch: {user.branch}</Text>
          </View>
          <View style={styles.profileRow}>
            <Icon name="account-tie" size={20} color={theme.colors.primary} style={styles.profileIcon} />
            <Text style={styles.profileText}>Role: {user.role}</Text>
          </View>

          {profileExists && !canEdit ? (
            <>
              <Text style={styles.profileText}>
                Your profile is complete. Raise a ticket to request changes.
              </Text>
              {hasPendingTickets && (
                <Text style={[styles.profileText, { color: theme.colors.warning, marginTop: 5 }]}>
                  You already have a pending ticket. Please wait for it to be resolved.
                </Text>
              )}
              <Button
                mode="contained"
                onPress={handleRaiseTicket}
                style={styles.button}
                labelStyle={styles.buttonLabel}
                icon="ticket"
                disabled={hasPendingTickets}
              >
                Raise Ticket
              </Button>
            </>
          ) : (
            <>
              <Text style={styles.profileText}>
                {profileExists ? 'Your profile can be updated.' : 'No profile data found. Please update your profile.'}
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('ProfileUpdate', { user, onProfileUpdated })}
                style={styles.button}
                labelStyle={styles.buttonLabel}
                icon="pencil"
                disabled={!canEdit && profileExists}
              >
                Update Profile
              </Button>
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Help Section Component
  const HelpSection = () => {
    const [activeAccordion, setActiveAccordion] = useState(null);

    const toggleAccordion = (index) => {
      setActiveAccordion(activeAccordion === index ? null : index);
    };

    const helpItems = [
      {
        icon: "account-edit",
        title: "How to update my profile?",
        content: "To update your profile, go to the Profile tab and click on the 'Update Profile' button. You can then edit your personal information and save the changes."
      },
      {
        icon: "file-document-edit",
        title: "How to generate a resume?",
        content: "Navigate to the Home tab and click on the 'Generate Resume' button. You can choose from different templates and customize your resume based on your profile information."
      },
      {
        icon: "format-list-bulleted",
        title: "How to view my assigned tasks?",
        content: "Go to the 'Tasks' tab to see all tasks assigned to you. Tasks are color-coded based on their due dates - green for on track, yellow for due soon, and red for overdue."
      },
      {
        icon: "ticket",
        title: "How to view my tickets?",
        content: "Navigate to the 'Tickets' tab to see all your submitted tickets. You can view their status and any responses from administrators."
      },
      {
        icon: "help-circle",
        title: "How to get additional help?",
        content: "If you need further assistance, please contact the university IT support team at support@university.edu or call the helpdesk at 555-123-4567."
      }
    ];

    return (
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
            <Icon name="help-circle" size={24} color={theme.colors.primary} style={{marginRight: 10}} />
            <Title style={styles.sectionTitle}>Help & Support</Title>
          </View>

          <Text style={{
            fontSize: 14,
            color: theme.colors.secondaryText,
            marginBottom: 15,
            lineHeight: 20
          }}>
            Welcome to the University App help section. Here you can find answers to common questions and learn how to use the system effectively.
          </Text>

          {/* FAQ Accordion */}
          {helpItems.map((item, index) => (
            <Card
              key={`faq-${index}`}
              style={{
                marginBottom: 10,
                borderRadius: 8,
                overflow: 'hidden',
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.primary,
              }}
            >
              <TouchableOpacity
                onPress={() => toggleAccordion(index)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 15,
                  backgroundColor: activeAccordion === index ? 'rgba(2, 136, 209, 0.1)' : 'white',
                }}
              >
                <Icon name={item.icon} size={20} color={theme.colors.primary} style={{marginRight: 10}} />
                <Text style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: '500',
                  color: theme.colors.text,
                }}>{item.title}</Text>
                <Icon
                  name={activeAccordion === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.secondaryText}
                />
              </TouchableOpacity>

              {activeAccordion === index && (
                <View style={{
                  padding: 15,
                  paddingTop: 0,
                  backgroundColor: 'rgba(2, 136, 209, 0.05)',
                }}>
                  <Text style={{
                    fontSize: 14,
                    lineHeight: 20,
                    color: theme.colors.secondaryText,
                  }}>{item.content}</Text>
                </View>
              )}
            </Card>
          ))}

          {/* Contact Information */}
          <View style={{
            marginTop: 15,
            padding: 15,
            backgroundColor: 'rgba(2, 136, 209, 0.05)',
            borderRadius: 8,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: 10,
            }}>Need more help?</Text>

            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
              <Icon name="email" size={18} color={theme.colors.primary} style={{marginRight: 10}} />
              <Text style={{color: theme.colors.text}}>support@university.edu</Text>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Icon name="phone" size={18} color={theme.colors.primary} style={{marginRight: 10}} />
              <Text style={{color: theme.colors.text}}>Helpdesk: 555-123-4567</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Privacy Policy Section Component
  const PrivacyPolicySection = () => {
    const [activeSection, setActiveSection] = useState(null);

    const toggleSection = (index) => {
      setActiveSection(activeSection === index ? null : index);
    };

    const policyItems = [
      {
        title: "Data Collection",
        content: "The University App collects personal information such as your name, email address, and academic details to provide you with personalized services. We also collect usage data to improve our application and user experience."
      },
      {
        title: "How We Use Your Information",
        content: "Your information is used to manage your account, facilitate communication between faculty and students, track academic progress, and assign tasks. We may also use anonymized data for statistical analysis and service improvement."
      },
      {
        title: "Data Security",
        content: "We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. All data is encrypted during transmission and at rest."
      },
      {
        title: "Third-Party Sharing",
        content: "We do not sell or rent your personal information to third parties. We may share anonymized data with trusted partners for analytical purposes. Any sharing of personal information will only occur with your explicit consent or as required by law."
      },
      {
        title: "Your Rights",
        content: "You have the right to access, correct, or delete your personal information. You may also request a copy of your data or restrict its processing. To exercise these rights, please contact our privacy team at privacy@university.edu."
      }
    ];

    return (
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
            <Icon name="shield-account" size={24} color={theme.colors.primary} style={{marginRight: 10}} />
            <Title style={styles.sectionTitle}>Privacy Policy</Title>
          </View>

          <Text style={{
            fontSize: 14,
            color: theme.colors.secondaryText,
            marginBottom: 15,
            lineHeight: 20
          }}>
            Last updated: June 1, 2023. This Privacy Policy describes how the University App collects, uses, and shares your personal information.
          </Text>

          {/* Policy Sections */}
          {policyItems.map((item, index) => (
            <Card
              key={`policy-${index}`}
              style={{
                marginBottom: 10,
                borderRadius: 8,
                overflow: 'hidden',
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.primary,
              }}
            >
              <TouchableOpacity
                onPress={() => toggleSection(index)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 15,
                  backgroundColor: activeSection === index ? 'rgba(2, 136, 209, 0.1)' : 'white',
                }}
              >
                <Icon name="shield-check" size={20} color={theme.colors.primary} style={{marginRight: 10}} />
                <Text style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: '500',
                  color: theme.colors.text,
                }}>{item.title}</Text>
                <Icon
                  name={activeSection === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.secondaryText}
                />
              </TouchableOpacity>

              {activeSection === index && (
                <View style={{
                  padding: 15,
                  paddingTop: 0,
                  backgroundColor: 'rgba(2, 136, 209, 0.05)',
                }}>
                  <Text style={{
                    fontSize: 14,
                    lineHeight: 20,
                    color: theme.colors.secondaryText,
                  }}>{item.content}</Text>
                </View>
              )}
            </Card>
          ))}

          {/* Contact for Privacy Concerns */}
          <View style={{
            marginTop: 15,
            padding: 15,
            backgroundColor: 'rgba(2, 136, 209, 0.05)',
            borderRadius: 8,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: 10,
            }}>Privacy Concerns?</Text>

            <Text style={{
              fontSize: 14,
              lineHeight: 20,
              color: theme.colors.secondaryText,
              marginBottom: 10,
            }}>
              If you have any questions or concerns about our privacy practices, please contact our privacy team:
            </Text>

            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
              <Icon name="email" size={18} color={theme.colors.primary} style={{marginRight: 10}} />
              <Text style={{color: theme.colors.text}}>privacy@university.edu</Text>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Icon name="phone" size={18} color={theme.colors.primary} style={{marginRight: 10}} />
              <Text style={{color: theme.colors.text}}>Privacy Office: 555-987-6543</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
          title="Pull to refresh"
          titleColor={theme.colors.secondaryText}
        />
      }
    >
      <View style={styles.innerContainer}>
        {/* Profile Section Button */}
        <TouchableOpacity
          style={styles.helpSupportButton}
          onPress={() => toggleSection('profile')}
        >
          <View style={styles.helpSupportButtonContent}>
            <Icon name="account" size={24} color={theme.colors.primary} style={{marginRight: 10}} />
            <View style={{flex: 1}}>
              <Text style={styles.helpSupportButtonText}>Student Profile</Text>
              <Text style={{fontSize: 12, color: theme.colors.secondaryText}}>View and update your profile information</Text>
            </View>
            <Icon
              name={expanded === 'profile' ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={theme.colors.secondaryText}
            />
          </View>
        </TouchableOpacity>

        {expanded === 'profile' && <StudentProfileSection />}

        {/* Divider with support text */}
        <View style={styles.sectionDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Support</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Help & Support Section Button */}
        <TouchableOpacity
          style={styles.helpSupportButton}
          onPress={() => toggleSection('help')}
        >
          <View style={styles.helpSupportButtonContent}>
            <Icon name="help-circle" size={24} color={theme.colors.primary} style={{marginRight: 10}} />
            <View style={{flex: 1}}>
              <Text style={styles.helpSupportButtonText}>Help & Support</Text>
              <Text style={{fontSize: 12, color: theme.colors.secondaryText}}>FAQs and contact information</Text>
            </View>
            <Icon
              name={expanded === 'help' ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={theme.colors.secondaryText}
            />
          </View>
        </TouchableOpacity>

        {expanded === 'help' && <HelpSection />}

        {/* Privacy Policy Section Button */}
        <TouchableOpacity
          style={styles.helpSupportButton}
          onPress={() => toggleSection('privacy')}
        >
          <View style={styles.helpSupportButtonContent}>
            <Icon name="shield-account" size={24} color={theme.colors.primary} style={{marginRight: 10}} />
            <View style={{flex: 1}}>
              <Text style={styles.helpSupportButtonText}>Privacy Policy</Text>
              <Text style={{fontSize: 12, color: theme.colors.secondaryText}}>How we handle your data</Text>
            </View>
            <Icon
              name={expanded === 'privacy' ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={theme.colors.secondaryText}
            />
          </View>
        </TouchableOpacity>

        {expanded === 'privacy' && <PrivacyPolicySection />}

        {/* Pull to refresh note */}
        <View style={styles.refreshNoteContainer}>
          <Icon name="gesture-swipe-down" size={20} color={theme.colors.secondaryText} />
          <Text style={styles.refreshNoteText}>Pull down to refresh</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Main StudentDashboard Component
export default function StudentDashboard({ navigation }) {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const tabOpacity = useSharedValue(0);

  const fetchTasks = async (userId, token) => {
    try {
      const tasksResponse = await axios.get(`${API_BASE_URL}/api/tasks/student/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasksResponse.data.tasks || []);
    } catch (error) {
      console.error('Fetch tasks error:', error);
      Alert.alert('Error', 'Failed to load tasks');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        if (!userData || !token) {
          throw new Error('No user data or token found');
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        await fetchTasks(parsedUser.id, token);
      } catch (error) {
        console.error('Fetch data error:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
        tabOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      }
    };
    fetchData();
  }, [tabOpacity]);

  const handleProfileUpdated = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let parsedDetails = {};
      try {
        if (response.data.profile.personal_details) {
          parsedDetails = typeof response.data.profile.personal_details === 'string'
            ? JSON.parse(response.data.profile.personal_details)
            : response.data.profile.personal_details;
        }
      } catch (parseError) {
        console.error('JSON parse error in handleProfileUpdated:', parseError);
        parsedDetails = { full_name: user.name, email: user.email };
      }

      setUser({ ...user, name: parsedDetails.full_name || user.name, email: parsedDetails.email || user.email });
    } catch (error) {
      console.error('Refresh profile error:', error);
    }
  };

  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const confirmLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
    setLogoutDialogVisible(false);
  };

  const handleTasksUpdated = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetchTasks(user.id, token);
    } catch (error) {
      console.error('Refresh tasks error:', error);
    }
  };

  const animatedTabStyle = useAnimatedStyle(() => ({
    opacity: tabOpacity.value,
  }));

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Icon name="school" size={32} color={theme.colors.surface} />
              <Text style={styles.headerTitle}>University</Text>
            </View>
            <IconButton
              icon="logout"
              color={theme.colors.surface}
              size={28}
              onPress={handleLogout}
              style={styles.headerLogoutButton}
            />
          </View>
        </View>
        <Animated.View style={[styles.tabContainer, animatedTabStyle]}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                let iconName;
                if (route.name === 'Home') iconName = 'home';
                else if (route.name === 'Tickets') iconName = 'ticket';
                else if (route.name === 'Tasks') iconName = 'format-list-bulleted';
                else if (route.name === 'Profile') iconName = 'account';
                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: theme.colors.secondaryText,
              tabBarStyle: styles.tabBar,
              tabBarLabelStyle: styles.tabLabel,
              headerShown: false,
            })}
          >
            <Tab.Screen name="Home">
              {() => <HomeScreen user={user} navigation={navigation} tasks={tasks} onTasksUpdated={handleTasksUpdated} />}
            </Tab.Screen>
            <Tab.Screen name="Tickets">
              {() => <TicketsScreen user={user} />}
            </Tab.Screen>
            <Tab.Screen name="Tasks">
              {() => <TasksScreen tasks={tasks} onTasksUpdated={handleTasksUpdated} />}
            </Tab.Screen>
            <Tab.Screen name="Profile">
              {() => <ProfileScreen user={user} navigation={navigation} onProfileUpdated={handleProfileUpdated} />}
            </Tab.Screen>
          </Tab.Navigator>
        </Animated.View>
        <Portal>
          <Dialog visible={logoutDialogVisible} onDismiss={() => setLogoutDialogVisible(false)} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>Confirm Logout</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={styles.dialogText}>Are you sure you want to logout?</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setLogoutDialogVisible(false)} textColor={theme.colors.secondaryText}>
                Cancel
              </Button>
              <Button onPress={confirmLogout} textColor={theme.colors.error}>Logout</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  // Metrics styles
  metricsContainer: {
    width: '90%',
    marginVertical: 15,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'center',
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3D5A80', // Darker blue
    marginBottom: 15,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A535C', // Darker teal
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    textAlign: 'center',
  },
  // Resume banner styles
  resumeBannerCard: {
    width: '90%',
    marginVertical: 15,
    borderRadius: 12,
    elevation: 8,
    backgroundColor: theme.colors.surface,
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 136, 209, 0.2)',
  },
  resumeBannerGradient: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  resumeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  resumeBannerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  resumeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  resumeTitleIcon: {
    marginRight: 8,
  },
  resumeBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  resumeBannerText: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    marginBottom: 15,
    lineHeight: 20,
  },
  resumeFeatures: {
    marginBottom: 15,
  },
  resumeFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resumeFeatureText: {
    fontSize: 13,
    color: theme.colors.text,
    marginLeft: 8,
  },
  resumeButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    elevation: 4,
  },
  resumeButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  resumeImageContainer: {
    position: 'relative',
    marginRight: 5,
  },
  resumeImageBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 136, 209, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeBannerIcon: {
    opacity: 0.9,
  },
  resumeBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF5722',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    elevation: 4,
  },
  resumeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 30,
    paddingHorizontal: 2,
    paddingBottom: 5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.surface,
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  headerLogoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
  },
  tabContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  innerContainer: {
    flex: 1,
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  welcomeCard: {
    width: '90%',
    marginVertical: 15,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: theme.colors.surface,
    alignSelf: 'center',
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 10,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    marginLeft: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: 0.3,
  },
  noDataText: {
    fontSize: 16,
    color: theme.colors.secondaryText,
    marginHorizontal: 20,
    marginVertical: 15,
    fontStyle: 'italic',
  },
  taskCardContainer: {
    width: '90%',
    marginBottom: 15,
    alignSelf: 'center',
  },
  taskCard: {
    borderRadius: 12,
    elevation: 4,
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 4,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  taskDetail: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    marginVertical: 3,
  },
  updateButton: {
    marginTop: 10,
    borderColor: theme.colors.primary,
    borderRadius: 8,
  },
  updateButtonLabel: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  formCard: {
    width: '90%',
    marginVertical: 15,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: theme.colors.surface,
    alignSelf: 'center',
  },
  input: {
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 0,
  },
  pickerLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 5,
    fontWeight: '500',
  },
  pickerBorder: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    marginTop: 5,
  },
  picker: {
    height: 50,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  button: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 5,
  },
  buttonLabel: {
    color: theme.colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  profileCard: {
    width: '90%',
    marginVertical: 15,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: theme.colors.surface,
    alignSelf: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  profileIcon: {
    marginRight: 15,
  },
  profileText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
    marginVertical: 5,
  },
  helpSupportButton: {
    width: '90%',
    marginVertical: 8,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: theme.colors.surface,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  helpSupportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  helpSupportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  tabBar: {
    backgroundColor: theme.colors.surface,
    elevation: 6,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 5,
    height: 60,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 5,
  },
  dialog: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  dialogTitle: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  dialogText: {
    color: theme.colors.secondaryText,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.secondaryText,
  },
  refreshNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  refreshNoteText: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    marginLeft: 8,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dividerText: {
    paddingHorizontal: 15,
    fontSize: 14,
    color: theme.colors.secondaryText,
    fontWeight: '500',
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  loadMoreButton: {
    borderColor: theme.colors.primary,
    borderRadius: 20,
    width: 150,
  },
  loadMoreButtonLabel: {
    color: theme.colors.primary,
    fontSize: 14,
  },
});