import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BadgeKind = 'campus' | 'urgent' | 'local' | 'errand';

export type Task = {
  id: string;
  badges: BadgeKind[];
  price: string;
  title: string;
  bids: string;
  location: string;
  date: string;
  description?: string;
  category?: string;
  service?: string;
};

export type DraftTask = {
  title: string;
  description: string;
  location: string;
  budget: string;
  category?: string;
  service?: string;
};

type TaskContextType = {
  tasks: Task[];
  draftTask: DraftTask | null;
  setDraftTask: (draft: DraftTask | null) => void;
  updateDraftTask: (fields: Partial<DraftTask>) => void;
  addTask: (draft: DraftTask) => string; // returns task ID
  resetDraftTask: () => void;
  isLoadingTasks: boolean;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const TASKS_STORAGE_KEY = '@taskhub_tasks';

const INITIAL_SAMPLE_TASKS: Task[] = [
  {
    id: 'sample-1',
    badges: ['campus', 'urgent'],
    price: '₦1,000',
    title: 'Print My Assignment',
    bids: '3 Bids',
    location: 'UI Main gate',
    date: '18 May',
    description: 'Need someone to print my assignment and bring it to Zik Hall as soon as possible.',
    category: 'campus',
    service: 'Printing & Photocopy',
  },
  {
    id: 'sample-2',
    badges: ['local'],
    price: '₦20,000',
    title: 'Fix my Laptop Screen',
    bids: '2 Bids',
    location: 'UI Main gate',
    date: '18 May',
    description: 'My laptop screen cracked. I need a technician to fix it.',
    category: 'local',
    service: 'Laptop Repair',
  },
  {
    id: 'sample-3',
    badges: ['errand'],
    price: '₦2,000',
    title: 'Deliver Package to Lekki',
    bids: '5 Bids',
    location: 'Ikorodu',
    date: '18 May',
    description: 'Deliver a confidential business envelope to Lekki Phase 1.',
    category: 'errands',
    service: 'Deliveries & Pickup',
  },
];

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draftTask, setDraftTaskState] = useState<DraftTask | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        const stored = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
        if (stored) {
          setTasks(JSON.parse(stored));
        } else {
          setTasks(INITIAL_SAMPLE_TASKS);
          await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_TASKS));
        }
      } catch (e) {
        console.error('Failed to load tasks', e);
        setTasks(INITIAL_SAMPLE_TASKS);
      } finally {
        setIsLoadingTasks(false);
      }
    }
    loadTasks();
  }, []);

  const setDraftTask = (draft: DraftTask | null) => {
    setDraftTaskState(draft);
  };

  const updateDraftTask = (fields: Partial<DraftTask>) => {
    setDraftTaskState((prev) => {
      if (!prev) {
        return {
          title: '',
          description: '',
          location: '',
          budget: '',
          ...fields,
        };
      }
      return { ...prev, ...fields };
    });
  };

  const resetDraftTask = () => {
    setDraftTaskState(null);
  };

  const addTask = (draft: DraftTask): string => {
    const id = `task-${Date.now()}`;
    
    // Map categories to BadgeKind
    let badges: BadgeKind[] = ['local'];
    if (draft.category === 'campus') {
      badges = ['campus'];
    } else if (draft.category === 'errands') {
      badges = ['errand'];
    } else if (draft.category === 'digital') {
      badges = ['errand']; // Remote/digital represented by errand or campus
    }
    
    // Check if it should be marked urgent
    if (draft.title.toLowerCase().includes('urgent') || draft.description.toLowerCase().includes('asap') || draft.description.toLowerCase().includes('urgent')) {
      badges.push('urgent');
    }

    const newTask: Task = {
      id,
      badges,
      price: draft.budget.startsWith('₦') ? draft.budget : `₦${draft.budget}`,
      title: draft.title || 'Untitled Task',
      bids: '0 Bids', // initial bids
      location: draft.location || 'UI, Ibadan',
      date: 'Today',
      description: draft.description,
      category: draft.category,
      service: draft.service,
    };

    setTasks((prev) => {
      const updated = [newTask, ...prev];
      AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated)).catch((e) =>
        console.error('Failed to save task list', e)
      );
      return updated;
    });

    // Reset draft task after successful post
    setDraftTaskState(null);

    return id;
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        draftTask,
        setDraftTask,
        updateDraftTask,
        addTask,
        resetDraftTask,
        isLoadingTasks,
      }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
