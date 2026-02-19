import type { CodeSnippet } from '../types.js';

export const RN_CODE_SNIPPETS: CodeSnippet[] = [
  {
    id: 'navigation-stack-setup',
    name: 'React Navigation Stack Setup',
    description: 'Complete React Navigation stack navigator setup with TypeScript types.',
    keywords: ['navigation', 'stack', 'navigator', 'screen', 'route', 'setup', 'react navigation'],
    category: 'navigation',
    dependencies: ['@react-navigation/native', '@react-navigation/native-stack', 'react-native-screens', 'react-native-safe-area-context'],
    code: `import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'User Profile' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}`,
    usage: 'npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context',
  },
  {
    id: 'api-client-axios',
    name: 'Axios API Client with Interceptors',
    description: 'Configured Axios instance with auth token injection, refresh token logic, and error handling.',
    keywords: ['api', 'axios', 'http', 'client', 'interceptor', 'token', 'refresh', 'request'],
    category: 'api',
    dependencies: ['axios'],
    code: `import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, refreshToken, clearAuth } from './auth-storage';

const api = axios.create({
  baseURL: 'https://api.example.com/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = \`Bearer \${newToken}\`;
        return api(originalRequest);
      } catch {
        await clearAuth();
        // Navigate to login
      }
    }
    return Promise.reject(error);
  }
);

export default api;`,
    usage: 'Import and use: const { data } = await api.get("/users/me");',
  },
  {
    id: 'use-debounce-hook',
    name: 'useDebounce Custom Hook',
    description: 'Debounce hook for search inputs, API calls, and other frequent updates.',
    keywords: ['debounce', 'hook', 'custom hook', 'search', 'input', 'delay', 'throttle'],
    category: 'hooks',
    code: `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage:
// const [search, setSearch] = useState('');
// const debouncedSearch = useDebounce(search, 500);
// useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);`,
    usage: 'const debouncedValue = useDebounce(searchText, 500);',
  },
  {
    id: 'use-async-storage-hook',
    name: 'useAsyncStorage Hook',
    description: 'Type-safe hook for reading/writing to AsyncStorage with loading state.',
    keywords: ['storage', 'async storage', 'persist', 'hook', 'local storage', 'cache'],
    category: 'storage',
    dependencies: ['@react-native-async-storage/async-storage'],
    code: `import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAsyncStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(key).then((item) => {
      if (item !== null) setStoredValue(JSON.parse(item));
      setLoading(false);
    });
  }, [key]);

  const setValue = useCallback(async (value: T | ((prev: T) => T)) => {
    const newValue = value instanceof Function ? value(storedValue) : value;
    setStoredValue(newValue);
    await AsyncStorage.setItem(key, JSON.stringify(newValue));
  }, [key, storedValue]);

  const removeValue = useCallback(async () => {
    setStoredValue(initialValue);
    await AsyncStorage.removeItem(key);
  }, [key, initialValue]);

  return { value: storedValue, setValue, removeValue, loading };
}`,
    usage: 'const { value: theme, setValue: setTheme, loading } = useAsyncStorage("theme", "light");',
  },
  {
    id: 'form-validation',
    name: 'Form with Validation (React Hook Form + Zod)',
    description: 'Type-safe form with validation using react-hook-form and zod schema.',
    keywords: ['form', 'validation', 'input', 'react-hook-form', 'zod', 'schema', 'submit'],
    category: 'forms',
    dependencies: ['react-hook-form', 'zod', '@hookform/resolvers'],
    code: `import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    console.log('Valid:', data);
  };

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
          </>
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              style={styles.input}
              placeholder="Password"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry
            />
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
          </>
        )}
      />
      <Button title="Login" onPress={handleSubmit(onSubmit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 8 },
  error: { color: 'red', fontSize: 12, marginBottom: 8 },
});`,
    usage: 'npx expo install react-hook-form zod @hookform/resolvers',
  },
  {
    id: 'push-notification-handler',
    name: 'Push Notification Handler (Expo)',
    description: 'Complete push notification setup with permission request, token registration, and foreground/background handling.',
    keywords: ['notification', 'push', 'fcm', 'apns', 'expo notifications', 'token', 'foreground'],
    category: 'notifications',
    dependencies: ['expo-notifications', 'expo-device', 'expo-constants'],
    code: `import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Configure foreground behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotifications().then(setExpoPushToken);

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Foreground notification:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      // Navigate based on notification data
      console.log('Notification tapped:', data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken };
}`,
    usage: 'const { expoPushToken } = useNotifications(); // Call in App root',
  },
  {
    id: 'auth-flow',
    name: 'Authentication Flow with Secure Storage',
    description: 'Complete auth flow with secure token storage, auto-login, and protected routes.',
    keywords: ['auth', 'login', 'logout', 'token', 'secure', 'protected', 'session', 'authentication'],
    category: 'auth',
    dependencies: ['expo-secure-store'],
    code: `import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useReducer, useMemo } from 'react';

type AuthState = { token: string | null; isLoading: boolean };
type AuthAction =
  | { type: 'RESTORE_TOKEN'; token: string | null }
  | { type: 'SIGN_IN'; token: string }
  | { type: 'SIGN_OUT' };

const AuthContext = createContext<{
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
} | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN': return { ...state, token: action.token, isLoading: false };
    case 'SIGN_IN': return { ...state, token: action.token, isLoading: false };
    case 'SIGN_OUT': return { ...state, token: null, isLoading: false };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { token: null, isLoading: true });

  useEffect(() => {
    SecureStore.getItemAsync('authToken').then((token) => {
      dispatch({ type: 'RESTORE_TOKEN', token });
    });
  }, []);

  const authActions = useMemo(() => ({
    signIn: async (email: string, password: string) => {
      const response = await fetch('https://api.example.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const { token } = await response.json();
      await SecureStore.setItemAsync('authToken', token);
      dispatch({ type: 'SIGN_IN', token });
    },
    signOut: async () => {
      await SecureStore.deleteItemAsync('authToken');
      dispatch({ type: 'SIGN_OUT' });
    },
  }), []);

  return (
    <AuthContext.Provider value={{ state, ...authActions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
}`,
    usage: 'Wrap App in <AuthProvider>. Use const { state, signIn, signOut } = useAuth();',
  },
  {
    id: 'keyboard-avoiding-form',
    name: 'Keyboard-Avoiding Form Layout',
    description: 'Properly handle keyboard appearance on iOS and Android with auto-scroll to focused input.',
    keywords: ['keyboard', 'avoiding', 'input', 'form', 'scroll', 'ios', 'android', 'keyboard avoiding view'],
    category: 'ui',
    code: `import { KeyboardAvoidingView, ScrollView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FormScreen() {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput style={styles.input} placeholder="Name" />
        <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Message" multiline numberOfLines={4} />
        {/* ScrollView auto-scrolls to focused input */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
});`,
    usage: 'Use as a screen component. Adjust keyboardVerticalOffset based on header height.',
  },
  {
    id: 'tanstack-query-setup',
    name: 'TanStack Query (React Query) Setup',
    description: 'Configure TanStack Query for data fetching with caching, background refetch, and error handling.',
    keywords: ['tanstack', 'react query', 'fetch', 'cache', 'query', 'mutation', 'data fetching', 'swr'],
    category: 'api',
    dependencies: ['@tanstack/react-query'],
    code: `import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api-client'; // your axios instance

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false, // disable for mobile
    },
  },
});

// Wrap App
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Navigation />
    </QueryClientProvider>
  );
}

// Query hook
export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get(\`/users/\${id}\`).then(res => res.data),
  });
}

// Mutation hook
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserDto) => api.patch('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

// In component:
// const { data: user, isLoading, error } = useUser('123');
// const { mutate: updateUser, isPending } = useUpdateUser();`,
    usage: 'npx expo install @tanstack/react-query',
  },
  {
    id: 'bottom-sheet-modal',
    name: 'Bottom Sheet Modal',
    description: 'Reusable bottom sheet component using @gorhom/bottom-sheet with gesture handling.',
    keywords: ['bottom sheet', 'modal', 'sheet', 'drawer', 'gesture', 'gorhom', 'action sheet'],
    category: 'ui',
    dependencies: ['@gorhom/bottom-sheet', 'react-native-reanimated', 'react-native-gesture-handler'],
    code: `import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useRef } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export function BottomSheetExample() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const handleOpen = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  );

  return (
    <View style={styles.container}>
      <Button title="Open Sheet" onPress={handleOpen} />
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.content}>
          <Text style={styles.title}>Bottom Sheet Content</Text>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  content: { flex: 1, padding: 16, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
});`,
    usage: 'npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler',
  },
];
