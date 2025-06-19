import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, Platform, SafeAreaView, TouchableOpacity, RefreshControl, Linking } from 'react-native';
import { Text, Button, Card, TextInput, IconButton, Title, ActivityIndicator, Dialog, Portal, Paragraph } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/ip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1E88E5',
    accent: '#64B5F6',
    background: '#F5F7FA',
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
const AnimatedTaskCard = ({ item, isStudentTask = false, index, onUpdateTask }) => {
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
              <Text style={styles.taskDetail}>
                {isStudentTask ? `Assigned to: ${item.assigned_to_name}` : `Assigned by: ${item.assigned_by}`}
              </Text>
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
                  {!isStudentTask && (
                    <Button
                      mode="outlined"
                      onPress={() => setUpdateDialogVisible(true)}
                      style={styles.updateButton}
                      labelStyle={styles.updateButtonLabel}
                      icon="pencil"
                    >
                      Update Task
                    </Button>
                  )}
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

// Home Screen: Displays Your Tasks (limited to 5), Metrics, and Attendance Button
function HomeScreen({ user, tasksAssignedToMe, studentTasks, navigation }) {
  const sortTasksByDate = (tasks) => {
    return [...tasks].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : null;
      const dateB = b.created_at ? new Date(b.created_at) : null;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB - dateA;
    });
  };

  const calculateTaskMetrics = () => {
    const totalMyTasks = tasksAssignedToMe.length;
    const totalStudentTasks = studentTasks.length;
    
    const today = new Date();
    const overdueMyTasks = tasksAssignedToMe.filter(task => {
      if (!task.due_date) return false;
      return new Date(task.due_date) < today;
    }).length;
    
    const overdueStudentTasks = studentTasks.filter(task => {
      if (!task.due_date) return false;
      return new Date(task.due_date) < today;
    }).length;
    
    const dueSoonMyTasks = tasksAssignedToMe.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 2;
    }).length;
    
    const dueSoonStudentTasks = studentTasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 2;
    }).length;
    
    return {
      totalMyTasks,
      totalStudentTasks,
      overdueMyTasks,
      overdueStudentTasks,
      dueSoonMyTasks,
      dueSoonStudentTasks
    };
  };

  const metrics = calculateTaskMetrics();
  const sortedTasksAssignedToMe = sortTasksByDate(tasksAssignedToMe);
  const limitedTasksAssignedToMe = sortedTasksAssignedToMe.slice(0, 5);

  const MetricCard = ({ title, value, icon, color }) => (
    <Card style={[styles.metricCard, { borderLeftColor: color }]}>
      <Card.Content style={styles.metricCardContent}>
        <View style={styles.metricIconContainer}>
          <Icon name={icon} size={28} color={color} />
        </View>
        <View style={styles.metricTextContainer}>
          <Text style={styles.metricValue}>{value}</Text>
          <Text style={styles.metricTitle}>{title}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.sectionTitle}>Dashboard</Text>
        <View style={styles.metricsContainer}>
          <View style={styles.metricRow}>
            <MetricCard 
              title="Your Tasks" 
              value={metrics.totalMyTasks} 
              icon="format-list-bulleted" 
              color={theme.colors.primary} 
            />
            <MetricCard 
              title="Student Tasks" 
              value={metrics.totalStudentTasks} 
              icon="account-group" 
              color={theme.colors.accent} 
            />
          </View>
          <View style={styles.metricRow}>
            <MetricCard 
              title="Overdue Tasks" 
              value={metrics.overdueMyTasks + metrics.overdueStudentTasks} 
              icon="alert-circle" 
              color={theme.colors.error} 
            />
            <MetricCard 
              title="Due Soon" 
              value={metrics.dueSoonMyTasks + metrics.dueSoonStudentTasks} 
              icon="clock-alert" 
              color={theme.colors.warning} 
            />
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('StudentAttendance')}
            style={[styles.button, { flex: 1, marginRight: 10 }]}
            labelStyle={styles.buttonLabel}
            icon="clipboard-check"
          >
            Mark Attendance
          </Button>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('ChatMessage')}
            style={[styles.button, { flex: 1 }]}
            labelStyle={styles.buttonLabel}
            icon="message"
          >
            Chat
          </Button>
        </View>

        <Text style={styles.sectionTitle}>Recent Tasks</Text>
        {limitedTasksAssignedToMe.length === 0 ? (
          <Text style={styles.noDataText}>No tasks assigned to you.</Text>
        ) : (
          limitedTasksAssignedToMe.map((item, index) => (
            <AnimatedTaskCard key={`task-${item.id}`} item={item} index={index} onUpdateTask={() => {}} />
          ))
        )
        }
      </View>
    </ScrollView>
  );
}

// Assign Task Screen: Form to assign tasks to students or self
function AssignTaskScreen({ user, students, onTaskAssigned }) {
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [isSelfAssign, setIsSelfAssign] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleAssignTask = async () => {
    if (!task || (!assignedTo && !isSelfAssign)) {
      Alert.alert('Error', 'Task and assignee are required');
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const formattedDueDate = dueDate
        ? dueDate.toISOString().split('T')[0]
        : null;

      if (isSelfAssign) {
        await axios.post(
          `${API_BASE_URL}/api/tasks/assign`,
          { 
            task, 
            due_date: formattedDueDate, 
            assigned_to: user.id, 
            role_flag: 'faculty' 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Task assigned to yourself successfully');
      } else if (assignedTo === 'all_students') {
        let successCount = 0;
        let errorCount = 0;
        
        Alert.alert('Processing', 'Assigning tasks to all students. This may take a moment...');
        
        for (const student of students) {
          try {
            await axios.post(
              `${API_BASE_URL}/api/tasks/assign`,
              { 
                task, 
                due_date: formattedDueDate, 
                assigned_to: student.id, 
                role_flag: 'student' 
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            successCount++;
          } catch (err) {
            console.error(`Error assigning to student ${student.id}:`, err);
            errorCount++;
          }
        }
        
        Alert.alert(
          'Task Assignment Complete', 
          `Successfully assigned to ${successCount} students${errorCount > 0 ? `, failed for ${errorCount} students` : ''}`
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/api/tasks/assign`,
          { 
            task, 
            due_date: formattedDueDate, 
            assigned_to: assignedTo, 
            role_flag: 'student' 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Task assigned successfully');
      }
      
      setTask('');
      setDueDate(null);
      setAssignedTo('');
      setIsSelfAssign(false);
      onTaskAssigned(isSelfAssign);
    } catch (error) {
      console.error('Assign task error:', error.response?.status, error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <Card style={styles.formCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Assign Task</Title>
            <TextInput
              label="Task Description"
              value={task}
              onChangeText={setTask}
              style={styles.input}
              mode="outlined"
              multiline
              theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
            />
            <View style={styles.datePickerContainer}>
              <Text style={styles.dateLabel}>Due Date</Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                labelStyle={styles.dateButtonLabel}
                icon="calendar"
              >
                {dueDate ? dueDate.toLocaleDateString() : 'Select Date'}
              </Button>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
            {!isSelfAssign && (
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Assign To Student</Text>
                <View style={styles.pickerBorder}>
                  <Picker
                    selectedValue={assignedTo}
                    onValueChange={(value) => setAssignedTo(value)}
                    style={styles.picker}
                    dropdownIconColor={theme.colors.primary}
                  >
                    <Picker.Item label="Select a student" value="" color={theme.colors.placeholder} />
                    <Picker.Item 
                      label={`All Students (${students.length})`} 
                      value="all_students" 
                      color={theme.colors.primary}
                      style={{fontWeight: 'bold'}}
                    />
                    <Picker.Item label="──────────────" enabled={false} />
                    {students.map((s) => (
                      <Picker.Item key={s.id} label={s.name} value={s.id} color={theme.colors.text} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}
            <Button
              mode="contained"
              onPress={() => setIsSelfAssign(!isSelfAssign)}
              style={[styles.button, { backgroundColor: isSelfAssign ? theme.colors.error : theme.colors.success }]}
              labelStyle={styles.buttonLabel}
              icon={isSelfAssign ? 'account' : 'account-group'}
            >
              {isSelfAssign ? 'Assign to Student' : 'Assign to Self'}
            </Button>
            <Button
              mode="contained"
              onPress={handleAssignTask}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              icon={isLoading ? "loading" : "send"}
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading && assignedTo === 'all_students' ? 'Assigning to All Students...' : 'Assign Task'}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

// Your Tasks Screen: List of tasks assigned to the faculty
function YourTasksScreen({ tasksAssignedToMe, onTasksUpdated }) {
  const [visibleTasks, setVisibleTasks] = useState(5);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const sortTasksByDueDate = (tasks) => {
    return [...tasks].sort((a, b) => {
      const dateA = a.due_date ? new Date(a.due_date) : null;
      const dateB = b.due_date ? new Date(b.due_date) : null;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA - dateB;
    });
  };

  const loadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleTasks(prev => prev + 5);
      setLoadingMore(false);
    }, 500);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await onTasksUpdated();
    setRefreshing(false);
  };

  const sortedTasks = sortTasksByDueDate(tasksAssignedToMe);

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

// Student Tasks Screen: List of tasks assigned to students
function StudentTasksScreen({ studentTasks, onTasksUpdated }) {
  const [visibleTasks, setVisibleTasks] = useState(5);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const sortTasksByDueDate = (tasks) => {
    return [...tasks].sort((a, b) => {
      const dateA = a.due_date ? new Date(a.due_date) : null;
      const dateB = b.due_date ? new Date(b.due_date) : null;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA - dateB;
    });
  };

  const loadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleTasks(prev => prev + 5);
      setLoadingMore(false);
    }, 500);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await onTasksUpdated();
    setRefreshing(false);
  };

  const sortedTasks = sortTasksByDueDate(studentTasks);

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
        <Title style={styles.sectionTitle}>Student Tasks</Title>
        {sortedTasks.length === 0 ? (
          <Text style={styles.noDataText}>No tasks assigned to students.</Text>
        ) : (
          <>
            {sortedTasks.slice(0, visibleTasks).map((item, index) => (
              <AnimatedTaskCard
                key={`student-task-${item.id}`}
                item={item}
                isStudentTask={true}
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

// Profile Screen: Display faculty info and allow profile updates
function ProfileScreen({ user, setUser }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/profile/update`,
        { name, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Profile updated successfully');
      
      const updatedUser = { ...user, name, email };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      setIsEditing(false);
    } catch (error) {
      console.error('Update profile error:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
              <Icon name="account" size={24} color={theme.colors.primary} style={{marginRight: 10}} />
              <Title style={styles.sectionTitle}>Faculty Profile</Title>
            </View>
            
            {!isEditing ? (
              <>
                <View style={styles.profileRow}>
                  <Icon name="account" size={20} color={theme.colors.primary} style={styles.profileIcon} />
                  <Text style={styles.profileText}>Name: {user.name}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Icon name="email" size={20} color={theme.colors.primary} style={styles.profileIcon} />
                  <Text style={styles.profileText}>Email: {user.email || 'N/A'}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Icon name="school" size={20} color={theme.colors.primary} style={styles.profileIcon} />
                  <Text style={styles.profileText}>Branch: {user.branch}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Icon name="briefcase" size={20} color={theme.colors.primary} style={styles.profileIcon} />
                  <Text style={styles.profileText}>Role: {user.role}</Text>
                </View>
                <Button
                  mode="contained"
                  onPress={() => setIsEditing(true)}
                  style={styles.button}
                  labelStyle={styles.buttonLabel}
                  icon="pencil"
                >
                  Edit Profile
                </Button>
              </>
            ) : (
              <>
                <Title style={[styles.sectionTitle, { marginTop: 20 }]}>Update Profile</Title>
                <TextInput
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  mode="outlined"
                  theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
                />
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                  theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
                />
                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={() => setIsEditing(false)}
                    style={[styles.button, { marginRight: 10, flex: 1 }]}
                    labelStyle={{ color: theme.colors.error }}
                    icon="close"
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleUpdateProfile}
                    style={[styles.button, { flex: 1 }]}
                    labelStyle={styles.buttonLabel}
                    icon="check"
                    loading={loading}
                    disabled={loading}
                  >
                    Update
                  </Button>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

// Main FacultyDashboard Component
export default function FacultyDashboard({ navigation }) {
  const [user, setUser] = useState(null);
  const [tasksAssignedToMe, setTasksAssignedToMe] = useState([]);
  const [studentTasks, setStudentTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const tabOpacity = useSharedValue(0);

  const fetchData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      if (!userData || !token) {
        throw new Error('No user data or token found');
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      const tasksResponse = await axios.get(
        `${API_BASE_URL}/api/tasks/faculty/${parsedUser.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasksAssignedToMe(tasksResponse.data.tasks || []);

      const studentTasksResponse = await axios.get(
        `${API_BASE_URL}/api/tasks/assigned-by/${parsedUser.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudentTasks(studentTasksResponse.data.tasks || []);

      const studentsResponse = await axios.get(
        `${API_BASE_URL}/api/dashboard/students`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { branch: parsedUser.branch },
        }
      );
      if (studentsResponse.data.students.length === 0) {
        Alert.alert('Info', 'No students found in your branch.');
      }
      setStudents(studentsResponse.data.students || []);
    } catch (error) {
      console.error('Fetch data error:', error.message, error.response?.status, error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      tabOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    }
  };

  useEffect(() => {
    fetchData();
  }, [tabOpacity]);

  const handleTaskAssigned = async (isSelfAssign) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (isSelfAssign) {
        const tasksResponse = await axios.get(
          `${API_BASE_URL}/api/tasks/faculty/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTasksAssignedToMe(tasksResponse.data.tasks || []);
      }
      const studentTasksResponse = await axios.get(
        `${API_BASE_URL}/api/tasks/assigned-by/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudentTasks(studentTasksResponse.data.tasks || []);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
  };

  const handleTasksUpdated = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const tasksResponse = await axios.get(
        `${API_BASE_URL}/api/tasks/faculty/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasksAssignedToMe(tasksResponse.data.tasks || []);
      const studentTasksResponse = await axios.get(
        `${API_BASE_URL}/api/tasks/assigned-by/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudentTasks(studentTasksResponse.data.tasks || []);
    } catch (error) {
      console.error('Refresh tasks error:', error);
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
                else if (route.name === 'Assign Task') iconName = 'plus-circle';
                else if (route.name === 'Your Tasks') iconName = 'format-list-bulleted';
                else if (route.name === 'Student Tasks') iconName = 'account-group';
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
              {() => <HomeScreen user={user} tasksAssignedToMe={tasksAssignedToMe} studentTasks={studentTasks} navigation={navigation} />}
            </Tab.Screen>
            <Tab.Screen name="Assign Task">
              {() => <AssignTaskScreen user={user} students={students} onTaskAssigned={handleTaskAssigned} />}
            </Tab.Screen>
            <Tab.Screen name="Your Tasks">
              {() => <YourTasksScreen tasksAssignedToMe={tasksAssignedToMe} onTasksUpdated={handleTasksUpdated} />}
            </Tab.Screen>
            <Tab.Screen name="Student Tasks">
              {() => <StudentTasksScreen studentTasks={studentTasks} onTasksUpdated={handleTasksUpdated} />}
            </Tab.Screen>
            <Tab.Screen name="Profile">
              {() => <ProfileScreen user={user} setUser={setUser} />}
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 15,
    color: theme.colors.text,
    letterSpacing: 0.3,
    textAlign: 'center',
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
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    padding: 10,
  },
  dateLabel: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  dateButton: {
    borderColor: theme.colors.primary,
    borderRadius: 8,
    marginLeft: 10,
  },
  dateButtonLabel: {
    color: theme.colors.primary,
    fontSize: 14,
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
    color: theme.colors.primary,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  picker: {
    height: 50,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  pickerBorder: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 181, 246, 0.05)',
    marginTop: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  button: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
  metricsContainer: {
    marginHorizontal: 15,
    marginBottom: 25,
    marginTop: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricCard: {
    width: '48%',
    borderLeftWidth: 4,
    elevation: 2,
    borderRadius: 8,
    height: 80,
  },
  metricCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    height: '100%',
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 13,
    color: theme.colors.secondaryText,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});