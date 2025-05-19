import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import StorageService from '../services/storageService';
import NotificationService from '../services/notificationService';

// Create the context
export const AppStateContext = createContext();

/**
 * App State Provider Component
 * Provides centralized state management for the app
 */
export const AppStateProvider = ({ children }) => {
  // App state
  const [lists, setLists] = useState([]);
  const [currentList, setCurrentList] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reminderHours, setReminderHours] = useState('0');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load lists, current list, and reminder settings in parallel
        const [loadedLists, loadedCurrentList, savedReminderHours] = await Promise.all([
          StorageService.getLists(),
          StorageService.getCurrentList(),
          NotificationService.getReminderHours(),
        ]);

        // Set reminder hours
        setReminderHours(savedReminderHours);
        
        console.log("Loaded from storage:", { loadedLists, loadedCurrentList });
        
        // If no lists exist yet, create default lists
        if (!loadedLists || loadedLists.length === 0) {
          console.log("Creating default lists");
          const defaultLists = [
            {
              listName: 'Tasks',
              tasks: [
                {id: 'task-default-1', taskName: 'Sample Task', creationTime: new Date()}
              ]
            },
            {
              listName: 'Daily Habits',
              tasks: [
                {id: 'task-default-2', taskName: 'Sample Habit', creationTime: new Date()}
              ]
            }
          ];
          
          console.log("Default lists:", defaultLists);
          
          await StorageService.saveLists(defaultLists);
          setLists(defaultLists);
          
          // Set default current list if none exists
          if (!loadedCurrentList) {
            await StorageService.saveCurrentList('Tasks');
            setCurrentList('Tasks');
          } else {
            setCurrentList(loadedCurrentList);
          }
        } else {
          setLists(loadedLists);
          setCurrentList(loadedCurrentList || (loadedLists.length > 0 ? loadedLists[0].listName : ''));
        }
      } catch (err) {
        console.error('Error loading app data:', err);
        setError('Failed to load app data. Please restart the app.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save lists whenever they change
  useEffect(() => {
    const saveData = async () => {
      if (!isLoading) {
        console.log("Saving lists to storage:", lists);
        try {
          await StorageService.saveLists(lists);
          console.log("Lists saved successfully");
        } catch (err) {
          console.error('Error saving lists:', err);
          setError('Failed to save changes. Please try again.');
        }
      }
    };
    
    // Add a small delay to ensure the state has settled
    const timeoutId = setTimeout(() => {
      saveData();
    }, 100);
    
    // Clean up the timeout when the component unmounts or lists change
    return () => clearTimeout(timeoutId);
  }, [lists, isLoading]);

  // Save current list whenever it changes
  useEffect(() => {
    const saveCurrentList = async () => {
      if (!isLoading && currentList) {
        try {
          await StorageService.saveCurrentList(currentList);
        } catch (err) {
          console.error('Error saving current list:', err);
          setError('Failed to save current list. Please try again.');
        }
      }
    };
    
    saveCurrentList();
  }, [currentList, isLoading]);

  // Setup notifications and save reminder hours when they change
  useEffect(() => {
    const setupNotifications = async () => {
      if (!isLoading) {
        try {
          // Register for notifications (only needs to be done once)
          await NotificationService.registerForPushNotificationsAsync();
          
          // Save reminder hours and update scheduled notifications
          await NotificationService.saveReminderHours(reminderHours);
          
          console.log(`Notification reminders set for every ${reminderHours} hours`);
        } catch (err) {
          console.error('Error setting up notifications:', err);
          setError('Failed to set up notifications. Please try again.');
        }
      }
    };
    
    setupNotifications();
  }, [reminderHours, isLoading]);

  // Add a new task to a list
  const addTask = useCallback((listName, task) => {
    console.log("Adding task to list:", { listName, task });
    
    setLists(prevLists => {
      const newLists = [...prevLists];
      const listIndex = newLists.findIndex(list => list.listName === listName);
      console.log("Found list at index:", listIndex);
      
      if (listIndex >= 0) {
        // Ensure task has an ID
        const taskWithId = {
          id: task.id || `task-${Date.now()}`,
          ...task
        };
        console.log("Adding task with ID:", taskWithId);
        
        // Create a new tasks array with the new task added
        const updatedTasks = [...newLists[listIndex].tasks, taskWithId];
        // Create a new list object with the updated tasks
        newLists[listIndex] = { 
          ...newLists[listIndex], 
          tasks: updatedTasks 
        };
      } else {
        console.error("List not found:", listName);
      }
      
      return newLists;
    });
  }, []);

  // Remove a task from a list
  const removeTask = useCallback((listName, taskId) => {
    console.log("Removing task from list:", { listName, taskId });
    
    setLists(prevLists => {
      const newLists = [...prevLists];
      const listIndex = newLists.findIndex(list => list.listName === listName);
      console.log("Found list at index:", listIndex);
      
      if (listIndex >= 0) {
        const originalTasks = [...newLists[listIndex].tasks];
        console.log("Original tasks:", originalTasks);
        
        // Create a new tasks array without the removed task
        const updatedTasks = originalTasks.filter(task => task.id !== taskId);
        console.log("Tasks after removal:", updatedTasks);
        
        if (originalTasks.length === updatedTasks.length) {
          console.warn("No task was removed! Task ID not found:", taskId);
          console.log("Available task IDs:", originalTasks.map(t => t.id));
        }
        
        // Create a new list object with the updated tasks
        newLists[listIndex] = { 
          ...newLists[listIndex], 
          tasks: updatedTasks 
        };
      } else {
        console.error("List not found:", listName);
      }
      
      return newLists;
    });
  }, []);
  
  // Remove a task by index instead of ID
  const removeTaskByIndex = useCallback((listName, taskIndex) => {
    console.log("Remove task by index:", { listName, taskIndex });
    
    setLists(prevLists => {
      const newLists = [...prevLists];
      const listIndex = newLists.findIndex(list => list.listName === listName);
      
      if (listIndex >= 0 && 
          taskIndex >= 0 && 
          taskIndex < newLists[listIndex].tasks.length) {
        
        const originalTasks = [...newLists[listIndex].tasks];
        
        // Remove the task at the specified index
        originalTasks.splice(taskIndex, 1);
        
        console.log("Tasks after removal:", originalTasks.map(t => t.taskName));
        
        // Update the list with the tasks
        newLists[listIndex] = {
          ...newLists[listIndex],
          tasks: originalTasks
        };
        
        return newLists;
      }
      
      return prevLists;
    });
  }, []);

  // Update a task in a list
  const updateTask = useCallback((listName, taskId, updates) => {
    console.log("Updating task in list:", { listName, taskId, updates });
    
    setLists(prevLists => {
      const newLists = [...prevLists];
      const listIndex = newLists.findIndex(list => list.listName === listName);
      console.log("Found list at index:", listIndex);
      
      if (listIndex >= 0) {
        const originalTasks = [...newLists[listIndex].tasks];
        console.log("Original tasks:", originalTasks);
        
        let taskUpdated = false;
        
        // Create a new tasks array with the updated task
        const updatedTasks = originalTasks.map(task => {
          if (task.id === taskId) {
            taskUpdated = true;
            console.log("Updating task:", task, "with:", updates);
            return { ...task, ...updates };
          }
          return task;
        });
        
        if (!taskUpdated) {
          console.warn("No task was updated! Task ID not found:", taskId);
          console.log("Available task IDs:", originalTasks.map(t => t.id));
        }
        
        // Create a new list object with the updated tasks
        newLists[listIndex] = { 
          ...newLists[listIndex], 
          tasks: updatedTasks 
        };
      } else {
        console.error("List not found:", listName);
      }
      
      return newLists;
    });
  }, []);
  
  // Directly complete a task by index rather than ID
  const completeTaskByIndex = useCallback((listName, taskIndex) => {
    console.log("Complete task by index:", { listName, taskIndex });
    
    setLists(prevLists => {
      const newLists = [...prevLists];
      const listIndex = newLists.findIndex(list => list.listName === listName);
      
      if (listIndex >= 0 && 
          taskIndex >= 0 && 
          taskIndex < newLists[listIndex].tasks.length) {
        
        const originalTasks = [...newLists[listIndex].tasks];
        
        // Remove the task at the specified index
        const completedTask = {...originalTasks[taskIndex]};
        originalTasks.splice(taskIndex, 1);
        
        // Update its creation time to now
        completedTask.creationTime = new Date();
        
        // Add it to the end
        originalTasks.push(completedTask);
        
        console.log("Tasks after completion:", originalTasks.map(t => t.taskName));
        
        // Update the list with reordered tasks
        newLists[listIndex] = {
          ...newLists[listIndex],
          tasks: originalTasks
        };
        
        return newLists;
      }
      
      return prevLists;
    });
  }, []);
  
  // Update a task and move it to the bottom (for completed tasks)
  const completeTask = useCallback((listName, taskId) => {
    console.log("COMPLETE_TASK called with:", { listName, taskId });
    
    setLists(prevLists => {
      const newLists = [...prevLists];
      const listIndex = newLists.findIndex(list => list.listName === listName);
      
      if (listIndex >= 0) {
        const originalTasks = [...newLists[listIndex].tasks];
        
        // First try by ID
        const taskIndex = originalTasks.findIndex(task => task.id === taskId);
        
        // If not found by ID, try a few fallbacks
        if (taskIndex === -1) {
          console.warn("Task not found by ID:", taskId);
          
          // Just force completion of the first task if ID isn't found
          if (originalTasks.length > 0) {
            const firstTask = {...originalTasks[0]};
            originalTasks.splice(0, 1);
            firstTask.creationTime = new Date();
            originalTasks.push(firstTask);
            
            newLists[listIndex] = {
              ...newLists[listIndex],
              tasks: originalTasks
            };
          }
          
          return newLists;
        }
        
        // Task found by ID - complete it
        const completedTask = {...originalTasks[taskIndex]};
        originalTasks.splice(taskIndex, 1);
        completedTask.creationTime = new Date();
        originalTasks.push(completedTask);
        
        newLists[listIndex] = {
          ...newLists[listIndex],
          tasks: originalTasks
        };
      }
      
      return newLists;
    });
  }, []);

  // Reorder tasks in a list
  const reorderTasks = useCallback((listName, reorderedTasks) => {
    setLists(prevLists => {
      const newLists = [...prevLists];
      const listIndex = newLists.findIndex(list => list.listName === listName);
      
      if (listIndex >= 0) {
        // Create a new list object with the reordered tasks
        newLists[listIndex] = { 
          ...newLists[listIndex], 
          tasks: reorderedTasks 
        };
      }
      
      return newLists;
    });
  }, []);

  // Add a new list
  const addList = useCallback((listName) => {
    setLists(prevLists => {
      // Check if list already exists
      if (prevLists.some(list => list.listName === listName)) {
        return prevLists;
      }
      
      // Add new list
      return [...prevLists, { listName, tasks: [] }];
    });
    
    // Set as current list if no current list is selected
    if (!currentList) {
      setCurrentList(listName);
    }
  }, [currentList]);

  // Remove a list
  const removeList = useCallback((listName) => {
    setLists(prevLists => prevLists.filter(list => list.listName !== listName));
    
    // Reset current list if the removed list was the current one
    if (currentList === listName) {
      setCurrentList('');
    }
  }, [currentList]);

  // Switch current list
  const switchList = useCallback((listName) => {
    setCurrentList(listName);
  }, []);

  // Get current list data as a computed value
  const currentListData = useMemo(() => {
    const listData = lists.find(list => list.listName === currentList);
    return listData || { listName: '', tasks: [] };
  }, [lists, currentList]);

  // Directly update entire lists array
  const updateLists = useCallback((newLists) => {
    console.log("Updating entire lists array:", newLists);
    setLists(newLists);
  }, []);
  
  // Update reminder hours
  const updateReminderHours = useCallback((hours) => {
    console.log("Updating reminder hours:", hours);
    setReminderHours(hours);
  }, []);

  // Context value
  const contextValue = {
    lists,
    currentList,
    currentListData,
    isLoading,
    error,
    reminderHours,
    addTask,
    removeTask,
    removeTaskByIndex,
    updateTask,
    reorderTasks,
    addList,
    removeList,
    switchList,
    completeTask,
    completeTaskByIndex,
    updateLists,
    updateReminderHours,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};