import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { Text, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Image
          source={{ uri: 'https://i.postimg.cc/PCCJfcSr/osmania-logo.png' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Osmania University</Text>
        <Text style={styles.subtitle}>Welcome to OU Connect</Text>
        <Text style={styles.intro}>
          OU Connect is your all-in-one platform for seamless academic management at Osmania University. 
          Access your dashboard, update profiles, create resumes, and stay connected with faculty and 
          administration. Empowering students, faculty, and admins for a smarter university experience.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
          labelStyle={styles.buttonText}
        >
          Get Started
        </Button>
        <View style={styles.featureContainer}>
          <View style={styles.feature}>
            <Icon name="school" size={30} color="#6200ea" />
            <Text style={styles.featureText}>Student Dashboard</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="file-document" size={30} color="#6200ea" />
            <Text style={styles.featureText}>Resume Builder</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="account-group" size={30} color="#6200ea" />
            <Text style={styles.featureText}>Faculty Connect</Text>
          </View>
        </View>
      </Animated.View>
      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.skipText}>Skip to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5', // Same background as LoginScreen
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6200ea',
    marginBottom: 15,
    textAlign: 'center',
  },
  intro: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
    lineHeight: 24,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#6200ea',
    borderRadius: 25,
    width: '60%',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  featureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  feature: {
    alignItems: 'center',
    width: '30%',
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  skipText: {
    fontSize: 16,
    color: '#6200ea',
    fontWeight: '500',
  },
});