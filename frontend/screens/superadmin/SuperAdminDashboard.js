import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, Platform, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, Button, Card, TextInput, IconButton, Title, ActivityIndicator, Dialog, Portal, Paragraph, Searchbar, Chip } from 'react-native-paper';
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
    primary: '#D81B60',
    accent: '#F06292',
    background: '#FCE4EC',
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



// Animated Activity Card Component
const AnimatedActivityCard = ({ item, index }) => {
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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'task': return 'format-list-bulleted';
      case 'ticket': return 'ticket';
      case 'user': return 'account';
      default: return 'information';
    }
  };

  return (
    <Animated.View style={[styles.activityCardContainer, animatedStyle]}>
      <Card style={styles.activityCard}>
        <Card.Content>
          <View style={styles.activityHeader}>
            <Icon name={getActivityIcon(item.type)} size={24} color={theme.colors.primary} />
            <Text style={styles.activityTitle}>{item.title}</Text>
          </View>
          <Text style={styles.activityDetail}>{item.description}</Text>
          <Text style={styles.activityTime}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

// Simple Line Graph Component
const SimpleLineGraph = ({ data, color, label, height = 100, animated = true }) => {
  // Find max value for scaling
  const maxValue = Math.max(...data);
  
  // Animation values
  const progress = useSharedValue(0);
  
  useEffect(() => {
    if (animated) {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 1500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      progress.value = 1;
    }
  }, [data, animated]);

  return (
    <View style={[styles.graphContainer, { height }]}>
      <Text style={[styles.graphLabel, { color }]}>{label}</Text>
      <View style={styles.graphContent}>
        {data.map((value, index) => {
          // Calculate height percentage based on max value
          const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
          
          return (
            <Animated.View 
              key={`bar-${index}`}
              style={[
                styles.graphBar,
                { 
                  backgroundColor: color,
                  height: withTiming(`${heightPercent}%`, { duration: 1000 }),
                  opacity: progress
                }
              ]}
            />
          );
        })}
      </View>
      <View style={styles.graphBaseline} />
    </View>
  );
};

// Simple Pie Chart Component
const SimplePieChart = ({ data }) => {
  // Animation value
  const progress = useSharedValue(0);
  
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [data]);

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate cumulative percentages for drawing
  let cumulativePercent = 0;
  const segments = data.map((item, index) => {
    const percent = total > 0 ? item.value / total : 0;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    
    return {
      ...item,
      percent,
      startPercent,
      endPercent: cumulativePercent,
    };
  });

  return (
    <View style={styles.pieChartContainer}>
      <View style={styles.pieChart}>
        {segments.map((segment, index) => {
          // Calculate the angles for the segment
          const startAngle = segment.startPercent * 2 * Math.PI - Math.PI/2;
          const endAngle = segment.endPercent * 2 * Math.PI - Math.PI/2;
          
          // Create a path for the segment
          const path = `
            M 50 50
            L ${50 + 45 * Math.cos(startAngle)} ${50 + 45 * Math.sin(startAngle)}
            A 45 45 0 ${endAngle - startAngle > Math.PI ? 1 : 0} 1 ${50 + 45 * Math.cos(endAngle)} ${50 + 45 * Math.sin(endAngle)}
            Z
          `;
          
          // Since we can't use SVG directly, we'll use a View with absolute positioning
          // This is a simplified approach - in a real app, you might use a library like react-native-svg
          const animatedRotation = useAnimatedStyle(() => {
            return {
              transform: [
                { scale: progress.value },
                { rotate: `${progress.value * 360 * segment.startPercent}deg` }
              ],
              opacity: progress.value,
            };
          });
          
          return (
            <View key={`segment-${index}`} style={styles.pieChartLegendItem}>
              <View style={[styles.legendColor, { backgroundColor: segment.color }]} />
              <Text style={styles.pieChartLegendText}>
                {segment.label}: {Math.round(segment.percent * 100)}%
              </Text>
            </View>
          );
        })}
      </View>
      
      {/* Simplified visual representation using colored blocks */}
      <View style={styles.pieChartVisual}>
        {segments.map((segment, index) => {
          const animatedStyle = useAnimatedStyle(() => {
            return {
              width: `${progress.value * segment.percent * 100}%`,
              backgroundColor: segment.color,
            };
          });
          
          return (
            <Animated.View 
              key={`visual-${index}`} 
              style={[styles.pieChartSegment, animatedStyle]} 
            />
          );
        })}
      </View>
    </View>
  );
};

// User Distribution Chart
const UserDistributionChart = ({ users }) => {
  // Calculate user distribution by role
  const roles = {};
  users.forEach(user => {
    if (!roles[user.role]) {
      roles[user.role] = 0;
    }
    roles[user.role]++;
  });
  
  // Prepare data for pie chart with vibrant colors
  const pieData = [
    { label: 'Students', value: roles['student'] || 0, color: '#FF6B6B' }, // coral red
    { label: 'Faculty', value: roles['faculty'] || 0, color: '#4ECDC4' }, // turquoise
    { label: 'Admin', value: roles['admin'] || 0, color: '#FFD166' }, // yellow
    { label: 'Other', value: users.length - (roles['student'] || 0) - (roles['faculty'] || 0) - (roles['admin'] || 0), color: '#6A0572' }, // purple
  ].filter(item => item.value > 0);
  
  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.metricsContainer, animatedStyle]}>
      <Title style={styles.metricsTitle}>User Distribution</Title>
      <SimplePieChart data={pieData} />
      
      {/* Role Statistics */}
      <View style={styles.branchStatsContainer}>
        {pieData.map((item, index) => (
          <View key={`role-stat-${index}`} style={styles.branchStatItem}>
            <View style={[styles.branchStatDot, { backgroundColor: item.color }]} />
            <Text style={styles.branchStatLabel}>{item.label}</Text>
            <Text style={styles.branchStatValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// Student Distribution by Branch Pie Chart Component
const StudentBranchPieChart = ({ users }) => {
  // Get only student users
  const students = users.filter(user => user.role === 'student');
  
  // Calculate student distribution by branch
  const branchCounts = {};
  students.forEach(student => {
    if (!student.branch) return;
    
    if (!branchCounts[student.branch]) {
      branchCounts[student.branch] = 0;
    }
    branchCounts[student.branch]++;
  });
  
  // Define vibrant colors for each branch
  const branchColors = [
    '#FF6B6B', // coral red
    '#4ECDC4', // turquoise
    '#FFD166', // yellow
    '#6A0572', // purple
    '#1A936F', // green
    '#3D5A80', // navy blue
    '#F18F01', // orange
    '#7B4B94', // violet
  ];
  
  // Prepare data for pie chart
  const pieData = Object.keys(branchCounts).map((branch, index) => ({
    label: branch,
    value: branchCounts[branch],
    color: branchColors[index % branchColors.length]
  }));
  
  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });
    scale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  return (
    <Animated.View style={[styles.metricsContainer, animatedStyle]}>
      <Title style={styles.metricsTitle}>Student Distribution by Branch</Title>
      
      {/* Pie Chart */}
      <View style={styles.branchPieContainer}>
        <SimplePieChart data={pieData} />
      </View>
      
      {/* Branch Statistics */}
      <View style={styles.branchStatsContainer}>
        {pieData.map((item, index) => (
          <View key={`branch-stat-${index}`} style={styles.branchStatItem}>
            <View style={[styles.branchStatDot, { backgroundColor: item.color }]} />
            <Text style={styles.branchStatLabel}>{item.label}</Text>
            <Text style={styles.branchStatValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// Dashboard Metrics Component
const DashboardMetrics = ({ users, tasks, tickets }) => {
  // Calculate metrics
  const studentCount = users.filter(u => u.role === 'student').length;
  const facultyCount = users.filter(u => u.role === 'faculty').length;
  const pendingTickets = tickets.filter(t => t.status === 'pending').length;
  const totalTickets = tickets.length;
  const totalTasks = tasks.length;

  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.metricsContainer, animatedStyle]}>
      <Title style={styles.metricsTitle}>Dashboard Metrics</Title>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Icon name="account-group" size={32} color="#FF6B6B" />
          <Text style={styles.metricValue}>{studentCount}</Text>
          <Text style={styles.metricLabel}>Students</Text>
        </View>
        <View style={styles.metricCard}>
          <Icon name="school" size={32} color="#4ECDC4" />
          <Text style={styles.metricValue}>{facultyCount}</Text>
          <Text style={styles.metricLabel}>Faculty</Text>
        </View>
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
          <Icon name="format-list-checks" size={32} color="#1A936F" />
          <Text style={styles.metricValue}>{totalTasks}</Text>
          <Text style={styles.metricLabel}>Total Tasks</Text>
        </View>
        <View style={styles.metricCard}>
          <Icon name="account" size={32} color="#6A0572" />
          <Text style={styles.metricValue}>{users.length}</Text>
          <Text style={styles.metricLabel}>Total Users</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Home Screen: with dashboard metrics
function HomeScreen({ user, users, tasks, tickets }) {
  const recentActivities = [
    ...tickets.slice(0, 3).map(t => ({
      type: 'ticket',
      title: `Ticket #${t.id} ${t.status}`,
      description: `By ${t.user_name}: ${t.description.substring(0, 50)}...`,
      timestamp: new Date().toISOString(),
    })),
    ...tasks.slice(0, 2).map(t => ({
      type: 'task',
      title: `Task: ${t.task.substring(0, 30)}...`,
      description: `Assigned to ${t.assigned_to_name} by ${t.assigned_by}`,
      timestamp: new Date(t.due_date || Date.now()).toISOString(),
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  return (
    <ScrollView style={styles.container}>
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
              Manage users, tasks, and tickets efficiently.
            </Text>
          </Card.Content>
        </Card>
        
        {/* Dashboard Metrics Section */}
        <DashboardMetrics users={users} tasks={tasks} tickets={tickets} />
        
        {/* User Distribution Chart */}
        <UserDistributionChart users={users} />
        
        {/* Student Branch Distribution Pie Chart */}
        <StudentBranchPieChart users={users} />
        
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Recent Activities</Title>
        </View>
        {recentActivities.length === 0 ? (
          <Text style={styles.noDataText}>No recent activities.</Text>
        ) : (
          recentActivities.map((item, index) => (
            <AnimatedActivityCard key={`activity-${index}`} item={item} index={index} />
          ))
        )}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Info', 'Navigate to Assign Task tab to assign a task.')}
          >
            <Icon name="plus-circle" size={24} color={theme.colors.surface} />
            <Text style={styles.quickActionText}>Assign Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Info', 'Navigate to Tickets tab to manage tickets.')}
          >
            <Icon name="ticket" size={24} color={theme.colors.surface} />
            <Text style={styles.quickActionText}>Manage Tickets</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Assign Task Screen: Assign tasks to students or faculty and view all tasks
function AssignTaskScreen({ user, users, tasks, onTaskAssigned }) {
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [roleFlag, setRoleFlag] = useState('student');
  const [loading, setLoading] = useState(false);
  
  // For task list pagination and search
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [displayedTasks, setDisplayedTasks] = useState([]);
  const [tasksToShow, setTasksToShow] = useState(10);
  const [hasMoreTasks, setHasMoreTasks] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleAssignTask = async () => {
    if (!task || !assignedTo || !roleFlag) {
      Alert.alert('Error', 'Task, assignee, and role are required');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formattedDueDate = dueDate
        ? dueDate.toISOString().split('T')[0]
        : null;

      // Handle "all students" or "all faculty" cases
      if (assignedTo === 'all_students' || assignedTo === 'all_faculty') {
        const targetUsers = users.filter(u => u.role === roleFlag);
        let successCount = 0;
        let errorCount = 0;
        
        // Create a progress dialog
        Alert.alert('Processing', `Assigning tasks to all ${roleFlag}. This may take a moment...`);
        
        for (const user of targetUsers) {
          try {
            await axios.post(
              `${API_BASE_URL}/api/tasks/assign`,
              { 
                task, 
                due_date: formattedDueDate, 
                assigned_to: user.id, 
                role_flag: roleFlag 
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            successCount++;
          } catch (err) {
            console.error(`Error assigning to ${roleFlag} ${user.id}:`, err);
            errorCount++;
          }
        }
        
        Alert.alert(
          'Task Assignment Complete', 
          `Successfully assigned to ${successCount} ${roleFlag}${errorCount > 0 ? `, failed for ${errorCount} ${roleFlag}` : ''}`
        );
      } else {
        // Assign to a single user
        await axios.post(
          `${API_BASE_URL}/api/tasks/assign`,
          { task, due_date: formattedDueDate, assigned_to: assignedTo, role_flag: roleFlag },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Task assigned successfully');
      }
      
      setTask('');
      setDueDate(null);
      setAssignedTo('');
      setRoleFlag('student');
      onTaskAssigned();
    } catch (error) {
      console.error('Assign task error:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => u.role === roleFlag);
  
  // Filter and sort tasks based on search query
  useEffect(() => {
    let result = [...tasks].sort((a, b) => b.id - a.id); // Latest first
    
    if (searchQuery) {
      result = result.filter(t => 
        (t.task && t.task.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.assigned_to_name && t.assigned_to_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredTasks(result);
    // Reset tasks to show when search changes
    setTasksToShow(10);
  }, [tasks, searchQuery]);
  
  // Effect to update displayed tasks based on tasksToShow
  useEffect(() => {
    const tasksToDisplay = filteredTasks.slice(0, tasksToShow);
    setDisplayedTasks(tasksToDisplay);
    setHasMoreTasks(filteredTasks.length > tasksToShow);
  }, [filteredTasks, tasksToShow]);
  
  // Handle loading more tasks
  const handleLoadMore = () => {
    setLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setTasksToShow(prev => prev + 10);
      setLoadingMore(false);
    }, 500);
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
              numberOfLines={4}
              theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
            />
            <View style={styles.datePickerContainer}>
              <Text style={styles.dateLabel}>Due Date (optional):</Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                labelStyle={styles.dateButtonLabel}
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
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={roleFlag}
                onValueChange={(value) => {
                  setRoleFlag(value);
                  setAssignedTo('');
                }}
                style={styles.picker}
              >
                <Picker.Item label="Student" value="student" />
                <Picker.Item label="Faculty" value="faculty" />
              </Picker>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={assignedTo}
                onValueChange={(value) => setAssignedTo(value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Assignee" value="" />
                {/* Add option to assign to all users of the selected role */}
                <Picker.Item 
                  label={`All ${roleFlag === 'student' ? 'Students' : 'Faculty'} (${filteredUsers.length})`} 
                  value={roleFlag === 'student' ? 'all_students' : 'all_faculty'} 
                  color={theme.colors.primary}
                  style={{fontWeight: 'bold'}}
                />
                <Picker.Item label="──────────────────" enabled={false} />
                {filteredUsers.map((u) => (
                  <Picker.Item key={`${u.role}-${u.id}`} label={`${u.name} (${u.branch || 'N/A'})`} value={u.id} />
                ))}
              </Picker>
            </View>
            <Button
              mode="contained"
              onPress={handleAssignTask}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              icon={loading ? "loading" : "send"}
              loading={loading}
              disabled={loading}
            >
              {loading && (assignedTo === 'all_students' || assignedTo === 'all_faculty') 
                ? `Assigning to All ${roleFlag === 'student' ? 'Students' : 'Faculty'}...` 
                : 'Assign Task'}
            </Button>
          </Card.Content>
        </Card>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>All Tasks</Title>
        </View>
        
        {/* Search Bar */}
        <Searchbar
          placeholder="Search tasks or assignees..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        {filteredTasks.length === 0 ? (
          <Text style={styles.noDataText}>No tasks found.</Text>
        ) : (
          <>
            {displayedTasks.map((item, index) => (
              <Animated.View key={`task-${item.id}`} style={styles.taskCardContainer}>
                <Card style={[styles.taskCard, { borderLeftColor: theme.colors.primary }]}>
                  <Card.Content>
                    <View style={styles.taskCardHeader}>
                      <Title style={styles.taskTitle}>
                        Task: {item.task && item.task.substring(0, 30)}...
                      </Title>
                    </View>
                    <Text style={styles.taskDetail}>
                      Assigned To: {item.assigned_to_name || 'N/A'}
                    </Text>
                    <Text style={styles.taskDetail}>
                      Due Date: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
                    </Text>
                    <Text style={styles.taskDetail}>
                      Status: {item.status || 'Pending'}
                    </Text>
                  </Card.Content>
                </Card>
              </Animated.View>
            ))}
            
            {/* Load More Button */}
            {hasMoreTasks && (
              <View style={styles.loadMoreContainer}>
                <Button
                  mode="outlined"
                  onPress={handleLoadMore}
                  loading={loadingMore}
                  disabled={loadingMore}
                  style={styles.loadMoreButton}
                  icon="chevron-down"
                >
                  Load More
                </Button>
                <Text style={styles.ticketCountText}>
                  Showing {displayedTasks.length} of {filteredTasks.length} tasks
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

// Tickets Screen: View and resolve tickets (latest first)
function TicketsScreen({ tickets, onTicketResolved }) {
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [displayedTickets, setDisplayedTickets] = useState([]);
  const [ticketsToShow, setTicketsToShow] = useState(10);
  const [hasMoreTickets, setHasMoreTickets] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [action, setAction] = useState('');
  const [response, setResponse] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showPrebuiltResponses, setShowPrebuiltResponses] = useState(false);
  
  // Prebuilt responses for different actions
  const prebuiltResponses = {
    approve: [
      "Your request has been approved. Thank you for your patience.",
      "We're happy to inform you that your ticket has been approved.",
      "Request approved. Please let us know if you need any further assistance."
    ],
    decline: [
      "We regret to inform you that your request cannot be approved at this time.",
      "Your request has been declined due to policy constraints.",
      "Unfortunately, we are unable to approve this request. Please contact the admin office for more details."
    ],
    general: [
      "Thank you for submitting your request. We'll process it as soon as possible.",
      "Your ticket has been processed. Please check your email for further instructions.",
      "We've received your request and it has been handled accordingly."
    ]
  };

  useEffect(() => {
    let result = [...tickets].sort((a, b) => b.id - a.id); // Latest first
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    if (searchQuery) {
      result = result.filter(t =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredTickets(result);
    
    // Reset tickets to show when filters change
    setTicketsToShow(10);
  }, [tickets, statusFilter, searchQuery]);
  
  // Effect to update displayed tickets based on ticketsToShow
  useEffect(() => {
    const ticketsToDisplay = filteredTickets.slice(0, ticketsToShow);
    setDisplayedTickets(ticketsToDisplay);
    setHasMoreTickets(filteredTickets.length > ticketsToShow);
  }, [filteredTickets, ticketsToShow]);

  const handleResolveTicket = async () => {
    if (!action || !response) {
      Alert.alert('Error', 'Action and response are required');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/tickets/${selectedTicket.id}/resolve`,
        { action, response },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', `Ticket ${action} successfully`);
      setDialogVisible(false);
      setAction('');
      setResponse('');
      setSelectedTicket(null);
      setShowPrebuiltResponses(false);
      onTicketResolved();
    } catch (error) {
      console.error('Resolve ticket error:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to resolve ticket');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle selecting a prebuilt response
  const selectPrebuiltResponse = (responseText) => {
    setResponse(responseText);
    setShowPrebuiltResponses(false);
  };
  
  // Handle loading more tickets
  const handleLoadMore = () => {
    setLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setTicketsToShow(prev => prev + 10);
      setLoadingMore(false);
    }, 500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return theme.colors.success;
      case 'declined': return theme.colors.error;
      case 'pending': return theme.colors.warning;
      default: return theme.colors.secondaryText;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Tickets</Title>
        </View>
        <Searchbar
          placeholder="Search tickets..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <View style={styles.filterContainer}>
          <Chip
            selected={statusFilter === 'all'}
            onPress={() => setStatusFilter('all')}
            style={styles.chip}
          >
            All
          </Chip>
          <Chip
            selected={statusFilter === 'pending'}
            onPress={() => setStatusFilter('pending')}
            style={styles.chip}
          >
            Pending
          </Chip>
          <Chip
            selected={statusFilter === 'approved'}
            onPress={() => setStatusFilter('approved')}
            style={styles.chip}
          >
            Approved
          </Chip>
          <Chip
            selected={statusFilter === 'declined'}
            onPress={() => setStatusFilter('declined')}
            style={styles.chip}
          >
            Declined
          </Chip>
        </View>
        {filteredTickets.length === 0 ? (
          <Text style={styles.noDataText}>No tickets found.</Text>
        ) : (
          <>
            {displayedTickets.map((item, index) => (
              <Animated.View key={`ticket-${item.id}`} style={styles.taskCardContainer}>
                <Card style={[styles.taskCard, { borderLeftColor: getStatusColor(item.status) }]}>
                  <Card.Content>
                    <View style={styles.taskCardHeader}>
                      <Title style={styles.taskTitle}>Ticket #{item.id}</Title>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    </View>
                    <Text style={styles.taskDetail}>By: {item.user_name}</Text>
                    <Text style={styles.taskDetail}>Description: {item.description}</Text>
                    <Text style={[styles.taskDetail, { color: getStatusColor(item.status) }]}>Status: {item.status}</Text>
                    {item.response && (
                      <Text style={styles.taskDetail}>Response: {item.response}</Text>
                    )}
                    {item.status === 'pending' && (
                      <Button
                        mode="contained"
                        onPress={() => {
                          setSelectedTicket(item);
                          setDialogVisible(true);
                        }}
                        style={styles.button}
                        labelStyle={styles.buttonLabel}
                        icon="pencil"
                      >
                        Resolve
                      </Button>
                    )}
                  </Card.Content>
                </Card>
              </Animated.View>
            ))}
            
            {/* Load More Button */}
            {hasMoreTickets && (
              <View style={styles.loadMoreContainer}>
                <Button
                  mode="outlined"
                  onPress={handleLoadMore}
                  loading={loadingMore}
                  disabled={loadingMore}
                  style={styles.loadMoreButton}
                  icon="chevron-down"
                >
                  Load More
                </Button>
                <Text style={styles.ticketCountText}>
                  Showing {displayedTickets.length} of {filteredTickets.length} tickets
                </Text>
              </View>
            )}
          </>
        )}
        <Portal>
          <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>Resolve Ticket #{selectedTicket?.id}</Dialog.Title>
            <Dialog.Content>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={action}
                  onValueChange={(value) => {
                    setAction(value);
                    // Reset prebuilt responses view when action changes
                    setShowPrebuiltResponses(false);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Action" value="" />
                  <Picker.Item label="Approve" value="approve" />
                  <Picker.Item label="Decline" value="decline" />
                </Picker>
              </View>
              
              <View style={styles.responseContainer}>
                <View style={styles.responseHeaderContainer}>
                  <Text style={styles.responseLabel}>Response</Text>
                  <TouchableOpacity 
                    onPress={() => setShowPrebuiltResponses(!showPrebuiltResponses)}
                    style={styles.prebuiltButton}
                  >
                    <Text style={styles.prebuiltButtonText}>
                      {showPrebuiltResponses ? 'Hide Templates' : 'Show Templates'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {showPrebuiltResponses && (
                  <View style={styles.prebuiltResponsesContainer}>
                    <ScrollView style={styles.prebuiltResponsesScroll}>
                      {/* Show responses based on selected action or general responses if no action selected */}
                      {(action ? prebuiltResponses[action] : prebuiltResponses.general).map((item, index) => (
                        <TouchableOpacity 
                          key={`response-${index}`}
                          style={styles.prebuiltResponseItem}
                          onPress={() => selectPrebuiltResponse(item)}
                        >
                          <Text style={styles.prebuiltResponseText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                <TextInput
                  label="Custom Response"
                  value={response}
                  onChangeText={setResponse}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
                />
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)} textColor={theme.colors.secondaryText}>
                Cancel
              </Button>
              <Button
                onPress={handleResolveTicket}
                textColor={theme.colors.primary}
                loading={loading}
                disabled={loading}
              >
                Submit
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </ScrollView>
  );
}

// Users Screen: Manage all users
function UsersScreen({ users }) {
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // For user list pagination
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [usersToShow, setUsersToShow] = useState(10);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let result = [...users];
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    if (searchQuery) {
      result = result.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredUsers(result);
    // Reset pagination when filters change
    setUsersToShow(10);
  }, [users, roleFilter, searchQuery]);

  // Effect to update displayed users based on usersToShow
  useEffect(() => {
    const usersToDisplay = filteredUsers.slice(0, usersToShow);
    setDisplayedUsers(usersToDisplay);
    setHasMoreUsers(filteredUsers.length > usersToShow);
  }, [filteredUsers, usersToShow]);

  // Handle loading more users
  const handleLoadMore = () => {
    setLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setUsersToShow(prev => prev + 10);
      setLoadingMore(false);
    }, 500);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Users</Title>
        </View>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <View style={styles.filterContainer}>
          <Chip
            selected={roleFilter === 'all'}
            onPress={() => setRoleFilter('all')}
            style={styles.chip}
          >
            All
          </Chip>
          <Chip
            selected={roleFilter === 'student'}
            onPress={() => setRoleFilter('student')}
            style={styles.chip}
          >
            Students
          </Chip>
          <Chip
            selected={roleFilter === 'faculty'}
            onPress={() => setRoleFilter('faculty')}
            style={styles.chip}
          >
            Faculty
          </Chip>
          <Chip
            selected={roleFilter === 'super_admin'}
            onPress={() => setRoleFilter('super_admin')}
            style={styles.chip}
          >
            Admins
          </Chip>
        </View>
        {filteredUsers.length === 0 ? (
          <Text style={styles.noDataText}>No users found.</Text>
        ) : (
          <>
            {displayedUsers.map((item, index) => (
              <Animated.View key={`${item.role}-${item.id}`} style={styles.taskCardContainer}>
                <Card style={styles.userCard}>
                  <Card.Content>
                    <View style={styles.userCardHeader}>
                      <View style={styles.userIconContainer}>
                        <Icon 
                          name={item.role === 'student' ? 'school' : item.role === 'faculty' ? 'briefcase' : 'shield'} 
                          size={24} 
                          color={theme.colors.primary} 
                          style={styles.userIcon}
                        />
                      </View>
                      <View style={styles.userInfoContainer}>
                        <Title style={styles.userName}>{item.name}</Title>
                        <Text style={styles.userDetail}>Email: {item.email || 'N/A'}</Text>
                        <Text style={styles.userDetail}>Role: {item.role}</Text>
                        <Text style={styles.userDetail}>Branch: {item.branch || 'N/A'}</Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              </Animated.View>
            ))}
            
            {/* Load More Button */}
            {hasMoreUsers && (
              <View style={styles.loadMoreContainer}>
                <Button
                  mode="outlined"
                  onPress={handleLoadMore}
                  loading={loadingMore}
                  disabled={loadingMore}
                  style={styles.loadMoreButton}
                  icon="chevron-down"
                >
                  Load More
                </Button>
                <Text style={styles.ticketCountText}>
                  Showing {displayedUsers.length} of {filteredUsers.length} users
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

// Account Screen: View Profile, Add Faculty, and Help in a list view with chevron
function AccountScreen({ user, setUser, onFacultyAdded }) {
  const [expanded, setExpanded] = useState(null); // 'viewProfile', 'addFaculty', or 'help'

  const toggleSection = (section) => {
    setExpanded(expanded === section ? null : section);
  };

  // View Profile Component
  const ViewProfile = () => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email || '');
    const [loading, setLoading] = useState(false);

    const handleUpdateProfile = async () => {
      if (!name || !email) {
        Alert.alert('Error', 'Name and email are required');
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
        // Update local user state
        const updatedUser = { ...user, name, email };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Update profile error:', error.response?.data);
        Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
      } finally {
        setLoading(false);
      }
    };

    return (
      <Card style={styles.profileCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Admin Profile</Title>
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
            <Icon name="shield" size={20} color={theme.colors.primary} style={styles.profileIcon} />
            <Text style={styles.profileText}>Role: {user.role}</Text>
          </View>
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
          <Button
            mode="contained"
            onPress={handleUpdateProfile}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            icon="pencil"
            loading={loading}
            disabled={loading}
          >
            Update Profile
          </Button>
        </Card.Content>
      </Card>
    );
  };

  // Add Faculty Component
  const AddFaculty = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [branch, setBranch] = useState('');
    const [loading, setLoading] = useState(false);

    const branches = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'];

    const handleAddFaculty = async () => {
      // Validate inputs
      if (!name || !email || !password || !confirmPassword || !branch) {
        Alert.alert('Error', 'All fields are required');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }

      // Validate password strength
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return;
      }

      // Validate password match
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        await axios.post(
          `${API_BASE_URL}/api/auth/add-faculty`,
          { name, email, password, branch, role: 'faculty' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Faculty added successfully');
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setBranch('');
        onFacultyAdded();
      } catch (error) {
        console.error('Add faculty error:', error.response?.data);
        Alert.alert('Error', error.response?.data?.message || 'Failed to add faculty. Please check your connection or try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <Card style={styles.formCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Add Faculty</Title>
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
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
          />
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
          />
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={branch}
              onValueChange={(value) => setBranch(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Branch" value="" />
              {branches.map((b) => (
                <Picker.Item key={b} label={b} value={b} />
              ))}
            </Picker>
          </View>
          <Button
            mode="contained"
            onPress={handleAddFaculty}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            icon="account-plus"
            loading={loading}
            disabled={loading}
          >
            Add Faculty
          </Button>
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
        content: "To update your profile, click on 'View Profile' in the Account tab. You can edit your name and email address, then click the 'Update Profile' button to save your changes."
      },
      {
        icon: "account-plus",
        title: "How to add a new faculty member?",
        content: "To add a new faculty member, click on 'Add Faculty' in the Account tab. Fill in all the required fields including name, email, password, and branch. Make sure the passwords match and the email format is valid."
      },
      {
        icon: "account-group",
        title: "How to manage users?",
        content: "You can manage all users from the 'Users' tab. There you can view all students, faculty members, and administrators. You can search for specific users using the search bar."
      },
      {
        icon: "ticket",
        title: "How to handle tickets?",
        content: "Navigate to the 'Tickets' tab to view and manage all support tickets. You can filter tickets by status and assign them to appropriate faculty members for resolution."
      },
      {
        icon: "shield-account",
        title: "What are my admin privileges?",
        content: "As a Super Admin, you have full access to all features of the University App. You can manage users, handle tickets, assign tasks, and add new faculty members. You also have the ability to view system-wide analytics and reports."
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
          
          {helpItems.map((item, index) => (
            <View key={`help-item-${index}`} style={{marginBottom: 10}}>
              <TouchableOpacity 
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 15,
                  backgroundColor: 'rgba(216, 27, 96, 0.08)',
                  borderRadius: 8,
                  marginBottom: 8
                }}
                onPress={() => toggleAccordion(index)}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                  <Icon name={item.icon} size={20} color={theme.colors.primary} style={{marginRight: 10}} />
                  <Text style={{fontSize: 16, color: theme.colors.text, flex: 1}}>{item.title}</Text>
                </View>
                <Icon 
                  name={activeAccordion === index ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={theme.colors.secondaryText}
                  style={{marginLeft: 10}}
                />
              </TouchableOpacity>
              {activeAccordion === index && (
                <View style={{
                  padding: 15,
                  paddingTop: 0,
                  backgroundColor: 'rgba(216, 27, 96, 0.03)',
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  marginTop: -8,
                  marginBottom: 8
                }}>
                  <Text style={{
                    fontSize: 14,
                    color: theme.colors.secondaryText,
                    lineHeight: 20
                  }}>{item.content}</Text>
                </View>
              )}
            </View>
          ))}
          
          <View style={{marginTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 15}}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
              <Icon name="headset" size={20} color={theme.colors.primary} style={{marginRight: 10}} />
              <Text style={{fontSize: 18, fontWeight: 'bold', color: theme.colors.text}}>Need more help?</Text>
            </View>
            <Text style={{
              fontSize: 14,
              color: theme.colors.secondaryText,
              marginBottom: 15
            }}>
              If you need additional assistance, please contact our support team:
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
              <Icon name="email" size={18} color={theme.colors.primary} style={{marginRight: 10, width: 20, textAlign: 'center'}} />
              <Text style={{fontSize: 14, color: theme.colors.text}}>support@universityapp.com</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
              <Icon name="phone" size={18} color={theme.colors.primary} style={{marginRight: 10, width: 20, textAlign: 'center'}} />
              <Text style={{fontSize: 14, color: theme.colors.text}}>+1-800-123-4567</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
              <Icon name="web" size={18} color={theme.colors.primary} style={{marginRight: 10, width: 20, textAlign: 'center'}} />
              <Text style={{fontSize: 14, color: theme.colors.text}}>www.universityapp.com/support</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => toggleSection('viewProfile')}
        >
          <Icon name="account" size={24} color={theme.colors.primary} style={styles.listIcon} />
          <Text style={styles.listText}>View Profile</Text>
          <Icon
            name={expanded === 'viewProfile' ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.colors.secondaryText}
          />
        </TouchableOpacity>
        {expanded === 'viewProfile' && <ViewProfile />}
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => toggleSection('addFaculty')}
        >
          <Icon name="account-plus" size={24} color={theme.colors.primary} style={styles.listIcon} />
          <Text style={styles.listText}>Add Faculty</Text>
          <Icon
            name={expanded === 'addFaculty' ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.colors.secondaryText}
          />
        </TouchableOpacity>
        {expanded === 'addFaculty' && <AddFaculty />}
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 15,
          paddingHorizontal: 10
        }}>
          <View style={{flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.1)'}} />
          <Text style={{
            paddingHorizontal: 10,
            color: theme.colors.secondaryText,
            fontSize: 12,
            fontWeight: '500'
          }}>SUPPORT</Text>
          <View style={{flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.1)'}} />
        </View>
        
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => toggleSection('help')}
        >
          <Icon name="help-circle" size={24} color={theme.colors.primary} style={styles.listIcon} />
          <View style={{flex: 1}}>
            <Text style={styles.listText}>Help & Support</Text>
            <Text style={{fontSize: 12, color: theme.colors.secondaryText}}>FAQs and contact information</Text>
          </View>
          <Icon
            name={expanded === 'help' ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.colors.secondaryText}
          />
        </TouchableOpacity>
        {expanded === 'help' && <HelpSection />}
      </View>
    </ScrollView>
  );
}

// Main SuperAdminDashboard Component
export default function SuperAdminDashboard({ navigation }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const tabOpacity = useSharedValue(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        if (!userData || !token) {
          throw new Error('No user data or token found');
        }

        const parsedUser = JSON.parse(userData);
        // Fetch super admin details to ensure email is included
        const response = await axios.get(`${API_BASE_URL}/api/dashboard/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const superAdmin = response.data.users.find(u => u.id === parsedUser.id && u.role === 'super_admin');
        if (superAdmin) {
          const updatedUser = { ...parsedUser, email: superAdmin.email };
          setUser(updatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          setUser(parsedUser);
        }

        setUsers(response.data.users || []);
        setTasks(response.data.tasks || []);
        setTickets(response.data.tickets || []);
      } catch (error) {
        console.error('Fetch data error:', error.response?.data);
        Alert.alert('Error', error.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
        tabOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      }
    };
    fetchData();
  }, [tabOpacity]);

  const handleTaskAssigned = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Refresh tasks error:', error);
    }
  };

  const handleTicketResolved = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Refresh tickets error:', error);
    }
  };

  const handleFacultyAdded = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Refresh users error:', error);
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
              <Text style={styles.headerTitle}>University Admin</Text>
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
                else if (route.name === 'Tickets') iconName = 'ticket';
                else if (route.name === 'Users') iconName = 'account-group';
                else if (route.name === 'Account') iconName = 'account';
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
              {() => <HomeScreen user={user} users={users} tasks={tasks} tickets={tickets} />}
            </Tab.Screen>
            <Tab.Screen name="Assign Task">
              {() => <AssignTaskScreen user={user} users={users} tasks={tasks} onTaskAssigned={handleTaskAssigned} />}
            </Tab.Screen>
            <Tab.Screen name="Tickets">
              {() => <TicketsScreen tickets={tickets} onTicketResolved={handleTicketResolved} />}
            </Tab.Screen>
            <Tab.Screen name="Users">
              {() => <UsersScreen users={users} />}
            </Tab.Screen>
            <Tab.Screen name="Account">
              {() => <AccountScreen user={user} setUser={setUser} onFacultyAdded={handleFacultyAdded} />}
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
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    padding: 15,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginVertical: 5,
    elevation: 2,
  },
  listIcon: {
    marginRight: 10,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
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

  activityCardContainer: {
    width: '90%',
    marginBottom: 15,
    alignSelf: 'center',
  },
  activityCard: {
    borderRadius: 12,
    elevation: 4,
    backgroundColor: theme.colors.surface,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 10,
    flex: 1,
  },
  activityDetail: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    marginVertical: 3,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    marginTop: 5,
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginVertical: 15,
  },
  quickActionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '45%',
    elevation: 4,
  },
  quickActionText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
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
  searchBar: {
    width: '90%',
    marginVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '90%',
    marginVertical: 10,
  },
  chip: {
    margin: 5,
    backgroundColor: theme.colors.surface,
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
  // New styles for user cards
  userCard: {
    borderRadius: 12,
    elevation: 4,
    backgroundColor: theme.colors.surface,
    marginVertical: 6,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userIconContainer: {
    marginRight: 15,
    backgroundColor: theme.colors.background,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIcon: {
    opacity: 0.9,
  },
  userInfoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    marginBottom: 5,
    color: theme.colors.primary,
  },
  userDetail: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    marginBottom: 3,
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginVertical: 15,
    paddingBottom: 10,
  },
  loadMoreButton: {
    width: '50%',
    borderColor: theme.colors.primary,
    borderRadius: 20,
  },
  ticketCountText: {
    marginTop: 8,
    color: theme.colors.secondaryText,
    fontSize: 12,
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
  formCard: {
    width: '90%',
    marginVertical: 15,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: theme.colors.surface,
    alignSelf: 'center',
  },
  profileCard: {
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
    marginHorizontal: 15,
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginRight: 10,
  },
  dateButton: {
    borderColor: theme.colors.primary,
    borderRadius: 8,
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  picker: {
    height: 48,
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
  // Dashboard Metrics Styles
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
    width: '30%',
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
  // Graph Styles
  graphCardContainer: {
    width: '90%',
    alignSelf: 'center',
    marginBottom: 15,
  },
  graphCard: {
    borderRadius: 12,
    elevation: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 5,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 10,
  },
  graphsContainer: {
    marginTop: 10,
  },
  graphContainer: {
    marginVertical: 10,
    paddingHorizontal: 5,
  },
  graphContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  graphBar: {
    flex: 1,
    marginHorizontal: 2,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  graphBaseline: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '100%',
    marginTop: 5,
  },
  graphLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 5,
  },
  graphLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.secondaryText,
  },
  // Pie Chart Styles
  pieChartContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  pieChart: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  pieChartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  pieChartLegendText: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    marginLeft: 5,
  },
  pieChartVisual: {
    height: 20,
    width: '100%',
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
  },
  pieChartSegment: {
    height: '100%',
  },
  // Branch Pie Chart Styles
  branchPieContainer: {
    marginTop: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  branchStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  branchStatItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 8,
    borderRadius: 8,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  branchStatDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  branchStatLabel: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  branchStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A535C',
  },
  // Help & Support Styles
  helpCard: {
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(219, 200, 200, 0.05)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helpHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(216, 27, 96, 0.1)',
  },
  helpIntro: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.secondaryText,
    marginBottom: 20,
    paddingHorizontal: 5,
    textAlign: 'justify',
  },
  accordionItem: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(216, 27, 96, 0.15)',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(216, 27, 96, 0.08)',
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    paddingRight: 10,
  },
  accordionContent: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(216, 27, 96, 0.08)',
  },
  accordionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333333',
    textAlign: 'justify',
  },
  contactSection: {
    marginTop: 25,
    padding: 18,
    backgroundColor: 'rgba(216, 27, 96, 0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(216, 27, 96, 0.1)',
  },
  contactText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.secondaryText,
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  contactIcon: {
    marginRight: 12,
  },
  contactDetail: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  // Styles for prebuilt responses feature
  responseContainer: {
    marginTop: 10,
  },
  responseHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  prebuiltButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  prebuiltButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  prebuiltResponsesContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  prebuiltResponsesScroll: {
    maxHeight: 150,
  },
  prebuiltResponseItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  prebuiltResponseText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  // Styles for prebuilt responses feature
  responseContainer: {
    marginTop: 10,
  },
  responseHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  prebuiltButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  prebuiltButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  prebuiltResponsesContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  prebuiltResponsesScroll: {
    maxHeight: 150,
  },
  prebuiltResponseItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  prebuiltResponseText: {
    fontSize: 14,
    color: theme.colors.text,
  },
});