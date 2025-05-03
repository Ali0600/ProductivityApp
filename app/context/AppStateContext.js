import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import StorageService from '../services/storageService';

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

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load lists and current list in parallel
        const [loadedLists, loadedCurrentList] = await Promise.all([
          StorageService.getLists(),
          StorageService.getCurrentList(),
        ]);
        
        setLists(loadedLists);
        setCurrentList(loadedCurrentList);
      } catch (err) {
        console.error('Error loading app data:', err);
        setError('Failed to load app data');
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
        await StorageService.saveLists(lists);
      }
    };
    
    saveData();
  }, [lists, isLoading]);

  // Save current list whenever it changes
  useEffect(() => {
    const saveCurrentList = async () => {
      if (!isLoading && currentList) {
        await StorageService.saveCurrentList(currentList);
      }
    };
    
    saveCurrentList();
  }, [currentList, isLoading]);

  // Add a new task to a list
  const addTask = useCallback((listName, task) => {
    setLists(prevLists => {
      const newLists = [...prevLists];
      const listIndex = newLists.findIndex(list => list.listName === listName);
      
      if (listIndex >= 0) {
        // Create a new tasks array with the new task added
        const updatedTasks = [...newLists[listIndex].tasks, task];
        // Create a new list object with the updated tasks
        newLists[listIndex] = { 
          ...newLists[listIndex], 
          tasks: updatedTasks 
        };
      }
      
      return newLists;
    });
  }, []);

  // Remove a task from a list
  const removeTask = useCallback((listName, taskId) => {
    setLists(prevLists => {
      const newLists = [...prevLists];
      const listIndex = newLists.findIndex(list => list.listName === listName);
      
      if (listIndex >= 0) {
        // Create a new tasks array without the removed task
        const updatedTasks = newLists[listIndex].tasks.filter(
          task => task.id !== taskId
        );
        // Create a new list object with the updated tasks
        newLists[listIndex] = { 
          ...newLists[listIndex], 
          tasks: updatedTasks 
        };
      }
      
      return newLists;
    });
  }, []);

  // Update a task in a list
  const updateTask = useCallback((listName, taskId, updates) => {
    setLists(prevLists => {
      const newLists = [...prevLists];
      const listIndex = newLists.findIndex(list => list.listName === listName);
      
      if (listIndex >= 0) {
        // Create a new tasks array with the updated task
        const updatedTasks = newLists[listIndex].tasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        );
        // Create a new list object with the updated tasks
        newLists[listIndex] = { 
          ...newLists[listIndex], 
          tasks: updatedTasks 
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

  // Get current list data
  const getCurrentListData = useMemo(() => {
    const listData = lists.find(list => list.listName === currentList);
    return listData || { listName: '', tasks: [] };
  }, [lists, currentList]);

  // Context value
  const contextValue = {
    lists,
    currentList,
    isLoading,
    error,
    getCurrentListData,
    addTask,
    removeTask,
    updateTask,
    reorderTasks,
    addList,
    removeList,
    switchList,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};