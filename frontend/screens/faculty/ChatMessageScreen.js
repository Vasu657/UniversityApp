import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  Avatar,
  ActivityIndicator,
  Button,
  TextInput,
  Title,
  Badge,
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/ip';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DefaultTheme } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Theme consistent with FacultyDashboard.js
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1E88E5',
    accent: '#64B5F6',
    background: '#F5F7FA',
    text: '#212121',
    secondaryText: '#757575',
    surface: '#FFFFFF',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#EF5350',
  },
};

// Animated Student Card Component with Unread Badge
const AnimatedStudentCard = ({ item, onSelect, isSelected, index, unreadCount }) => {
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

  return (
    <Animated.View style={[styles.studentCardContainer, animatedStyle]}>
      <TouchableOpacity onPress={() => onSelect(item)}>
        <Card style={[styles.studentCard, isSelected && styles.selectedStudentCard]}>
          <Card.Content style={styles.studentCardContent}>
            <Avatar.Text
              size={40}
              label={item.name.charAt(0).toUpperCase()}
              color={theme.colors.surface}
              backgroundColor={theme.colors.primary}
              style={styles.avatar}
            />
            <View style={styles.studentInfo}>
              <View style={styles.studentNameContainer}>
                <Text style={styles.studentName}>{item.name}</Text>
                {unreadCount > 0 && (
                  <Badge size={20} style={styles.unreadBadge}>
                    {unreadCount}
                  </Badge>
                )}
              </View>
              <Text style={styles.studentEmail} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ChatMessageScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const flatListRef = useRef(null);
  const textInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const tabOpacity = useSharedValue(0);

  // Fetch students
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.get(`${API_BASE_URL}/api/chat/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(response.data.students || []);
      if (response.data.students.length === 0) {
        setError('No students found in your branch.');
      }
      await fetchUnreadCounts(response.data.students.map(s => s.id));
    } catch (error) {
      const errorMessage = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`
        : error.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
      tabOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    }
  };

  // Fetch unread message counts for all students
  const fetchUnreadCounts = async (studentIds) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const newUnreadCounts = {};
      for (const studentId of studentIds) {
        const response = await axios.get(
          `${API_BASE_URL}/api/chat/messages/${studentId}/student`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const unread = response.data.messages.filter(
          msg => msg.sender_role === 'student' && !msg.is_read
        ).length;
        newUnreadCounts[studentId] = unread;
      }
      setUnreadCounts(newUnreadCounts);
    } catch (error) {
      // Silent fail for unread counts
    }
  };

  // Fetch messages for selected student and mark as read
  const fetchMessages = async (studentId) => {
    if (!studentId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/chat/messages/${studentId}/student`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data.messages || []);
      await axios.post(
        `${API_BASE_URL}/api/chat/mark-read/${studentId}/student`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCounts(prev => ({ ...prev, [studentId]: 0 }));
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      const errorMessage = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`
        : error.message;
      setError(errorMessage);
    }
  };

  // Start polling for new messages
  const startPolling = (studentId) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(studentId);
      fetchUnreadCounts(students.map(s => s.id));
    }, 5000);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedStudent) return;
    setSending(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/chat/send`,
        {
          receiver_id: selectedStudent.id,
          receiver_role: 'student',
          message: newMessage.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
      await fetchMessages(selectedStudent.id);
      textInputRef.current?.blur();
      Keyboard.dismiss();
    } catch (error) {
      const errorMessage = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`
        : error.message;
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setMessages([]);
    fetchMessages(student.id);
    startPolling(student.id);
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  // Cleanup on unmount and initial fetch
  useEffect(() => {
    fetchStudents();
    return () => stopPolling();
  }, []);

  // Animated style for main content
  const animatedTabStyle = useAnimatedStyle(() => ({
    opacity: tabOpacity.value,
  }));

  // Render message item
  const renderMessageItem = ({ item }) => {
    const isSent = item.sender_role === 'faculty';
    return (
      <View style={[styles.messageContainer, isSent ? styles.sentMessage : styles.receivedMessage]}>
        <Text style={[styles.messageText, isSent && styles.sentMessageText]}>
          {item.message}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Icon name="message" size={32} color={theme.colors.surface} />
            <Text style={styles.headerTitle}>Chat Messages</Text>
          </View>
        </View>
      </View>
      <Animated.View style={[styles.container, animatedTabStyle]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 80} // Increased offset for better positioning
        >
          <View style={styles.content}>
            {/* Student List */}
            {!selectedStudent ? (
              <ScrollView
                style={styles.studentList}
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
                  <Title style={styles.sectionTitle}>Students</Title>
                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                      <Button
                        mode="contained"
                        onPress={fetchStudents}
                        style={styles.retryButton}
                        labelStyle={styles.retryButtonLabel}
                        icon="refresh"
                      >
                        Retry
                      </Button>
                    </View>
                  ) : students.length === 0 ? (
                    <Text style={styles.noDataText}>No students available in your branch.</Text>
                  ) : (
                    students.map((item, index) => (
                      <AnimatedStudentCard
                        key={`student-${item.id}`}
                        item={item}
                        onSelect={handleStudentSelect}
                        isSelected={selectedStudent?.id === item.id}
                        index={index}
                        unreadCount={unreadCounts[item.id] || 0}
                      />
                    ))
                  )}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.chatWindow}>
                <View style={styles.chatHeader}>
                  <IconButton
                    icon="arrow-left"
                    color={theme.colors.primary}
                    size={24}
                    onPress={() => {
                      setSelectedStudent(null);
                      setMessages([]);
                      stopPolling();
                    }}
                    style={styles.backButton}
                  />
                  <Avatar.Text
                    size={40}
                    label={selectedStudent.name.charAt(0).toUpperCase()}
                    color={theme.colors.surface}
                    backgroundColor={theme.colors.primary}
                  />
                  <Text style={styles.chatHeaderName}>{selectedStudent.name}</Text>
                </View>
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={renderMessageItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.messageList}
                  contentContainerStyle={styles.messageListContent}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <Text style={styles.noMessagesText}>No messages yet.</Text>
                  }
                  onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                  onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      ref={textInputRef}
                      value={newMessage}
                      onChangeText={setNewMessage}
                      placeholder="Type a message..."
                      style={styles.messageInput}
                      multiline
                      maxLength={1000}
                      theme={{ colors: { primary: theme.colors.primary, background: theme.colors.surface } }}
                    />
                    <IconButton
                      icon="send"
                      color={theme.colors.primary}
                      size={24}
                      onPress={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      style={styles.sendButton}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
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
    justifyContent: 'flex-start',
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  studentList: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  innerContainer: {
    flex: 1,
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  studentCardContainer: {
    width: '90%',
    marginBottom: 15,
    alignSelf: 'center',
  },
  studentCard: {
    borderRadius: 12,
    elevation: 4,
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  selectedStudentCard: {
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    borderLeftColor: theme.colors.accent,
  },
  studentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    marginRight: 10,
  },
  studentInfo: {
    flex: 1,
  },
  studentNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  studentEmail: {
    fontSize: 12,
    color: theme.colors.secondaryText,
  },
  unreadBadge: {
    backgroundColor: theme.colors.success,
    marginLeft: 10,
  },
  chatWindow: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 10,
    flex: 1,
  },
  backButton: {
    marginRight: 10,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageListContent: {
    paddingVertical: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    maxWidth: '70%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 12,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  sentMessageText: {
    color: theme.colors.surface,
  },
  messageTime: {
    fontSize: 10,
    color: theme.colors.secondaryText,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 25,
    paddingHorizontal: 12,
    height: 50,
    marginHorizontal: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    width: 36,
    height: 36,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: theme.colors.secondaryText,
    marginHorizontal: 20,
    marginVertical: 15,
    fontStyle: 'italic',
  },
  noMessagesText: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    width: 150,
  },
  retryButtonLabel: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 15,
    color: theme.colors.text,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});