import type { StateManagementGuide } from '../types.js';

export const RN_STATE_MANAGEMENT_GUIDES: StateManagementGuide[] = [
  {
    id: 'zustand',
    name: 'Zustand',
    description: 'Lightweight, hook-based state management with minimal boilerplate. The most popular choice for new React Native projects.',
    keywords: ['zustand', 'lightweight', 'simple', 'hooks', 'minimal', 'small'],
    bundleSize: '~1.1 KB (minified + gzipped)',
    learningCurve: 'easy',
    bestFor: 'Small to medium apps, teams preferring simplicity, rapid prototyping',
    features: ['No providers/wrappers needed', 'Selective re-rendering via selectors', 'Built-in persist middleware', 'Devtools support', 'TypeScript-first', 'Immer middleware for immutable updates'],
    codeExample: `import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  login: async (email, password) => {
    set({ isLoading: true });
    const user = await authApi.login(email, password);
    set({ user, isLoading: false });
  },
  logout: () => set({ user: null }),
}));

// In component — only re-renders when 'user' changes
const user = useAuthStore((state) => state.user);`,
    pros: ['Minimal boilerplate', 'No context providers', 'Excellent TypeScript support', 'Tiny bundle size', 'Easy to test'],
    cons: ['No built-in computed values (use derived state)', 'Less structured for very large apps', 'No middleware ecosystem as large as Redux'],
    links: { docs: 'https://zustand-demo.pmnd.rs/', github: 'https://github.com/pmndrs/zustand' },
  },
  {
    id: 'redux-toolkit',
    name: 'Redux Toolkit (RTK)',
    description: 'Official, opinionated Redux setup with simplified API. Best for complex apps with heavy async logic.',
    keywords: ['redux', 'rtk', 'toolkit', 'flux', 'reducer', 'action', 'middleware', 'thunk', 'saga'],
    bundleSize: '~11 KB (minified + gzipped, includes immer)',
    learningCurve: 'moderate',
    bestFor: 'Large apps, complex async flows, teams with Redux experience, enterprise projects',
    features: ['createSlice for reducers + actions', 'RTK Query for data fetching/caching', 'Immer built-in for immutable updates', 'Redux DevTools', 'Middleware support (thunk, saga, etc.)', 'Entity adapter for normalized state'],
    codeExample: `import { createSlice, configureStore } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, isLoading: false },
  reducers: {
    setUser: (state, action) => { state.user = action.payload; },
    logout: (state) => { state.user = null; },
  },
});

const store = configureStore({
  reducer: { auth: authSlice.reducer },
});

// RTK Query for API
const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getUser: builder.query({ query: (id) => \`/users/\${id}\` }),
  }),
});`,
    pros: ['Battle-tested at scale', 'RTK Query eliminates data fetching boilerplate', 'Excellent DevTools', 'Huge middleware ecosystem', 'Predictable state updates'],
    cons: ['More boilerplate than Zustand/Jotai', 'Steeper learning curve', 'Larger bundle size', 'Provider wrapper required'],
    links: { docs: 'https://redux-toolkit.js.org/', github: 'https://github.com/reduxjs/redux-toolkit' },
  },
  {
    id: 'jotai',
    name: 'Jotai',
    description: 'Atomic state management inspired by Recoil but simpler. Each piece of state is an independent atom.',
    keywords: ['jotai', 'atomic', 'atom', 'primitive', 'bottom-up', 'recoil alternative'],
    bundleSize: '~2.4 KB (minified + gzipped)',
    learningCurve: 'easy',
    bestFor: 'Apps with many independent pieces of state, fine-grained reactivity needs',
    features: ['Atomic state model', 'Derived atoms (computed values)', 'Async atoms', 'No string keys required', 'React Suspense support', 'Built-in utilities (atomWithStorage, etc.)'],
    codeExample: `import { atom, useAtom } from 'jotai';

const countAtom = atom(0);
const doubleCountAtom = atom((get) => get(countAtom) * 2);

// Async atom
const userAtom = atom(async () => {
  const res = await fetch('/api/user');
  return res.json();
});

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const [double] = useAtom(doubleCountAtom); // auto-derived
  return <Text onPress={() => setCount(c => c + 1)}>{count} (double: {double})</Text>;
}`,
    pros: ['Very small bundle', 'No providers needed (optional)', 'Natural derived state', 'Fine-grained re-renders', 'Works well with React Suspense'],
    cons: ['Atom sprawl in large apps', 'Less opinionated structure', 'Debugging harder without DevTools setup', 'Newer ecosystem'],
    links: { docs: 'https://jotai.org/', github: 'https://github.com/pmndrs/jotai' },
  },
  {
    id: 'mobx',
    name: 'MobX (with mobx-state-tree)',
    description: 'Reactive state management using observables. MobX-State-Tree adds structure with models and actions.',
    keywords: ['mobx', 'mst', 'mobx-state-tree', 'observable', 'reactive', 'mutable', 'ignite'],
    bundleSize: '~16 KB (MobX) + ~20 KB (MST)',
    learningCurve: 'moderate',
    bestFor: 'Apps with complex domain models, teams from OOP backgrounds, Ignite boilerplate users',
    features: ['Observable state with auto-tracking', 'Computed values (automatic derivations)', 'MST: typed models with runtime validation', 'MST: snapshots and time-travel debugging', 'MST: references and identifiers', 'Minimal re-renders via fine-grained tracking'],
    codeExample: `import { types } from 'mobx-state-tree';
import { observer } from 'mobx-react-lite';

const UserStore = types
  .model('UserStore', {
    name: types.string,
    age: types.number,
  })
  .views((self) => ({
    get isAdult() { return self.age >= 18; },
  }))
  .actions((self) => ({
    setName(name: string) { self.name = name; },
  }));

const UserCard = observer(({ store }) => (
  <Text>{store.name} ({store.isAdult ? 'Adult' : 'Minor'})</Text>
));`,
    pros: ['Auto-tracked dependencies (no selectors needed)', 'MST provides structure and validation', 'Excellent for complex domain models', 'Snapshots for persistence/debugging'],
    cons: ['Largest bundle size', 'Proxy-based — can be confusing', 'MST has significant learning curve', 'Less mainstream than Redux/Zustand'],
    links: { docs: 'https://mobx.js.org/', github: 'https://github.com/mobxjs/mobx' },
  },
  {
    id: 'react-context',
    name: 'React Context + useReducer',
    description: 'Built-in React state management. No additional dependencies but limited performance optimization.',
    keywords: ['context', 'useReducer', 'useContext', 'built-in', 'native', 'no library', 'react state'],
    bundleSize: '0 KB (built into React)',
    learningCurve: 'easy',
    bestFor: 'Small apps, theme/auth/locale context, avoiding external dependencies',
    features: ['Built into React (no deps)', 'useReducer for complex state logic', 'Provider pattern for dependency injection', 'Works with any React version'],
    codeExample: `const AuthContext = createContext<AuthState>(null);

function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
}`,
    pros: ['Zero dependencies', 'Familiar React patterns', 'Good for infrequently changing state', 'Simple to understand'],
    cons: ['All consumers re-render on any context change', 'No built-in selectors or memoization', 'Context hell with many providers', 'No DevTools or middleware'],
    links: { docs: 'https://react.dev/learn/scaling-up-with-reducer-and-context' },
  },
  {
    id: 'legend-state',
    name: 'Legend State',
    description: 'Ultra-fast reactive state with fine-grained reactivity and built-in persistence.',
    keywords: ['legend', 'legend-state', 'fast', 'reactive', 'signal', 'fine-grained', 'observable'],
    bundleSize: '~4 KB (minified + gzipped)',
    learningCurve: 'easy',
    bestFor: 'Performance-critical apps, apps needing built-in sync/persistence, signal-based reactivity fans',
    features: ['Fine-grained reactivity (no selectors)', 'Built-in persistence (AsyncStorage, MMKV)', 'Sync engine for remote state', 'Computed observables', 'Tiny bundle', 'React and React Native optimized'],
    codeExample: `import { observable } from '@legendapp/state';
import { observer } from '@legendapp/state/react';
import { persistObservable } from '@legendapp/state/persist';

const state$ = observable({
  user: { name: '', email: '' },
  settings: { darkMode: false },
});

persistObservable(state$.settings, { local: 'settings' });

const Profile = observer(function Profile() {
  // Only re-renders when name changes
  return <Text>{state$.user.name.get()}</Text>;
});`,
    pros: ['Fastest re-render performance', 'Built-in persistence and sync', 'No provider wrappers', 'Tiny bundle size', 'Signal-based API'],
    cons: ['Smaller community', 'Observable proxy pattern may be unfamiliar', 'Less ecosystem/middleware', 'Newer library'],
    links: { docs: 'https://legendapp.com/open-source/state/', github: 'https://github.com/LegendApp/legend-state' },
  },
];
