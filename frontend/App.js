import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './screens/auth/WelcomeScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import StudentDashboard from './screens/student/StudentDashboard';
import ProfileUpdateScreen from './screens/student/ProfileScreen';
import ResumeTemplate from './screens/student/ResumeTemplate';
import FacultyDashboard from './screens/faculty/FacultyDashboard';
import SuperAdminDashboard from './screens/superadmin/SuperAdminDashboard';

const Stack = createStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                <Stack.Screen name="StudentDashboard" component={StudentDashboard} options={{ headerShown: false }} />
                <Stack.Screen name="FacultyDashboard" component={FacultyDashboard} options={{ headerShown: false }} />
                <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboard} options={{ headerShown: false }} />
                <Stack.Screen name="ProfileUpdate" component={ProfileUpdateScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ResumeTemplate" component={ResumeTemplate} options={{ headerShown: false }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}