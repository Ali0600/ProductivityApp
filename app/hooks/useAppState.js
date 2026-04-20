import { useContext, useCallback } from 'react';
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
    removeTaskByIndex, 
    updateTask, 
    reorderTasks,
    completeTask,
    completeTaskByIndex
  } = useAppState();
  
  // Find the specified list
  const list = lists.find(list => list.listName === listName);
  const tasks = list ? list.tasks : [];

  // Task management functions — memoized so consumers can use them as stable props
  const addTaskToList = useCallback((task) => addTask(listName, task), [addTask, listName]);
  const removeTaskFromList = useCallback((taskId) => removeTask(listName, taskId), [removeTask, listName]);
  const removeTaskFromListByIndex = useCallback((index) => removeTaskByIndex(listName, index), [removeTaskByIndex, listName]);
  const updateTaskInList = useCallback((taskId, updates) => updateTask(listName, taskId, updates), [updateTask, listName]);
  const reorderTasksInList = useCallback((reorderedTasks) => reorderTasks(listName, reorderedTasks), [reorderTasks, listName]);
  const completeTaskInList = useCallback((taskId) => completeTask(listName, taskId), [completeTask, listName]);
  const completeTaskInListByIndex = useCallback((index) => completeTaskByIndex(listName, index), [completeTaskByIndex, listName]);
  
  return {
    tasks,
    addTaskToList,
    removeTaskFromList,
    removeTaskFromListByIndex,
    updateTaskInList,
    reorderTasksInList,
    completeTaskInList,
    completeTaskInListByIndex,
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
    currentListData,
    addList,
    removeList,
    switchList,
    updateLists,
    moveSideList,
  } = useAppState();

  return {
    lists,
    currentList,
    currentListData,
    addList,
    removeList,
    switchList,
    updateLists,
    moveSideList,
  };
};

/**
 * Custom hook for main list management (tile grid)
 * @returns {Object} Main list data with computed staleness and management functions
 */
export const useMainLists = () => {
  const {
    mainLists,
    mainListsWithStaleness,
    currentMainList,
    currentMainData,
    addMainList,
    removeMainList,
    renameMainList,
    switchMainList,
    exitToTileGrid,
  } = useAppState();

  return {
    mainLists,
    mainListsWithStaleness,
    currentMainList,
    currentMainData,
    addMainList,
    removeMainList,
    renameMainList,
    switchMainList,
    exitToTileGrid,
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