import { useContext } from 'react';
import { AppStateContext } from '../context/AppStateContext';

/**
 * Custom hook to access the app state context
 * @returns {Object} App state context value
 */
export const useAppState = () => {
  const context = useContext(AppStateContext);
  
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  
  return context;
};

/**
 * Custom hook to access and manage tasks for a specific list
 * @param {string} listName - The name of the list to manage
 * @returns {Object} Task management functions and data for the specified list
 */
export const useListTasks = (listName) => {
  const { 
    lists, 
    addTask, 
    removeTask, 
    updateTask, 
    reorderTasks 
  } = useAppState();
  
  // Find the specified list
  const list = lists.find(list => list.listName === listName);
  const tasks = list ? list.tasks : [];
  
  // Task management functions
  const addTaskToList = (task) => addTask(listName, task);
  const removeTaskFromList = (taskId) => removeTask(listName, taskId);
  const updateTaskInList = (taskId, updates) => updateTask(listName, taskId, updates);
  const reorderTasksInList = (reorderedTasks) => reorderTasks(listName, reorderedTasks);
  
  return {
    tasks,
    addTaskToList,
    removeTaskFromList,
    updateTaskInList,
    reorderTasksInList,
  };
};

/**
 * Custom hook to access and manage lists
 * @returns {Object} List management functions and data
 */
export const useLists = () => {
  const { 
    lists, 
    currentList, 
    getCurrentListData,
    addList, 
    removeList, 
    switchList 
  } = useAppState();
  
  return {
    lists,
    currentList,
    currentListData: getCurrentListData(),
    addList,
    removeList,
    switchList,
  };
};

/**
 * Custom hook to access loading state and errors
 * @returns {Object} Loading state and error information
 */
export const useAppLoading = () => {
  const { isLoading, error } = useAppState();
  
  return {
    isLoading,
    error,
    hasError: !!error,
  };
};