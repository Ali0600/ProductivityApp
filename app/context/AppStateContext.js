import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import StorageService from '../services/storageService';

export const AppStateContext = createContext();

const DEFAULT_MAIN_LIST_NAME = 'Tasks';

const createDefaultMainLists = () => [
  {
    name: DEFAULT_MAIN_LIST_NAME,
    sideLists: [
      {
        listName: 'Tasks',
        tasks: [{ id: 'task-default-1', taskName: 'Sample Task', creationTime: new Date() }],
        lastCompletedAt: null,
      },
      {
        listName: 'Daily Habits',
        tasks: [{ id: 'task-default-2', taskName: 'Sample Habit', creationTime: new Date() }],
        lastCompletedAt: null,
      },
    ],
  },
];

// Migrate the old flat `lists` shape into a single default Main List
const wrapOldListsIntoMain = (oldLists) => [
  {
    name: DEFAULT_MAIN_LIST_NAME,
    sideLists: (oldLists || []).map((sl) => ({
      listName: sl.listName,
      tasks: sl.tasks ?? [],
      lastCompletedAt: null,
    })),
  },
];

export const AppStateProvider = ({ children }) => {
  const [mainLists, setMainLists] = useState([]);
  const [currentMainList, setCurrentMainList] = useState('');
  const [currentSideList, setCurrentSideList] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const loadedMain = await StorageService.getMainLists();
        if (loadedMain !== null && Array.isArray(loadedMain)) {
          setMainLists(loadedMain);
        } else {
          const oldLists = await StorageService.getLists();
          if (oldLists && oldLists.length > 0) {
            const migrated = wrapOldListsIntoMain(oldLists);
            setMainLists(migrated);
            await StorageService.saveMainLists(migrated);
          } else {
            const defaults = createDefaultMainLists();
            setMainLists(defaults);
            await StorageService.saveMainLists(defaults);
          }
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

  useEffect(() => {
    if (isLoading) return;
    const t = setTimeout(() => {
      StorageService.saveMainLists(mainLists).catch((err) => {
        console.error('Error saving mainLists:', err);
        setError('Failed to save changes. Please try again.');
      });
    }, 100);
    return () => clearTimeout(t);
  }, [mainLists, isLoading]);

  const mutateSideList = useCallback((mainName, sideName, mutator) => {
    setMainLists((prev) =>
      prev.map((ml) => {
        if (ml.name !== mainName) return ml;
        return {
          ...ml,
          sideLists: ml.sideLists.map((sl) => (sl.listName === sideName ? mutator(sl) : sl)),
        };
      })
    );
  }, []);

  // --- Task ops (scoped to currentMainList) ---
  const addTask = useCallback(
    (listName, task) => {
      if (!currentMainList) return;
      mutateSideList(currentMainList, listName, (sl) => ({
        ...sl,
        tasks: [...sl.tasks, { id: task.id || `task-${Date.now()}`, ...task }],
      }));
    },
    [currentMainList, mutateSideList]
  );

  const removeTask = useCallback(
    (listName, taskId) => {
      if (!currentMainList) return;
      mutateSideList(currentMainList, listName, (sl) => ({
        ...sl,
        tasks: sl.tasks.filter((t) => t.id !== taskId),
      }));
    },
    [currentMainList, mutateSideList]
  );

  const removeTaskByIndex = useCallback(
    (listName, idx) => {
      if (!currentMainList) return;
      mutateSideList(currentMainList, listName, (sl) => {
        if (idx < 0 || idx >= sl.tasks.length) return sl;
        const next = [...sl.tasks];
        next.splice(idx, 1);
        return { ...sl, tasks: next };
      });
    },
    [currentMainList, mutateSideList]
  );

  const updateTask = useCallback(
    (listName, taskId, updates) => {
      if (!currentMainList) return;
      mutateSideList(currentMainList, listName, (sl) => ({
        ...sl,
        tasks: sl.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      }));
    },
    [currentMainList, mutateSideList]
  );

  const completeTaskByIndex = useCallback(
    (listName, idx) => {
      if (!currentMainList) return;
      mutateSideList(currentMainList, listName, (sl) => {
        if (idx < 0 || idx >= sl.tasks.length) return sl;
        const next = [...sl.tasks];
        const done = { ...next[idx], creationTime: new Date() };
        next.splice(idx, 1);
        next.push(done);
        return { ...sl, tasks: next, lastCompletedAt: new Date() };
      });
    },
    [currentMainList, mutateSideList]
  );

  const completeTask = useCallback(
    (listName, taskId) => {
      if (!currentMainList) return;
      mutateSideList(currentMainList, listName, (sl) => {
        const idx = sl.tasks.findIndex((t) => t.id === taskId);
        if (idx === -1) return sl;
        const next = [...sl.tasks];
        const done = { ...next[idx], creationTime: new Date() };
        next.splice(idx, 1);
        next.push(done);
        return { ...sl, tasks: next, lastCompletedAt: new Date() };
      });
    },
    [currentMainList, mutateSideList]
  );

  const reorderTasks = useCallback(
    (listName, reorderedTasks) => {
      if (!currentMainList) return;
      mutateSideList(currentMainList, listName, (sl) => ({ ...sl, tasks: reorderedTasks }));
    },
    [currentMainList, mutateSideList]
  );

  // --- Side list ops (scoped to currentMainList) ---
  const addList = useCallback(
    (sideListName) => {
      if (!currentMainList || !sideListName) return;
      setMainLists((prev) =>
        prev.map((ml) => {
          if (ml.name !== currentMainList) return ml;
          if (ml.sideLists.some((sl) => sl.listName === sideListName)) return ml;
          return {
            ...ml,
            sideLists: [
              ...ml.sideLists,
              { listName: sideListName, tasks: [], lastCompletedAt: null },
            ],
          };
        })
      );
      if (!currentSideList) setCurrentSideList(sideListName);
    },
    [currentMainList, currentSideList]
  );

  const removeList = useCallback(
    (sideListName) => {
      if (!currentMainList) return;
      setMainLists((prev) =>
        prev.map((ml) =>
          ml.name === currentMainList
            ? { ...ml, sideLists: ml.sideLists.filter((sl) => sl.listName !== sideListName) }
            : ml
        )
      );
      if (currentSideList === sideListName) setCurrentSideList('');
    },
    [currentMainList, currentSideList]
  );

  const switchList = useCallback((sideListName) => {
    setCurrentSideList(sideListName);
  }, []);

  const updateLists = useCallback(
    (reorderedSideLists) => {
      if (!currentMainList) return;
      setMainLists((prev) =>
        prev.map((ml) =>
          ml.name === currentMainList ? { ...ml, sideLists: reorderedSideLists } : ml
        )
      );
    },
    [currentMainList]
  );

  // --- Main list ops ---
  const addMainList = useCallback((name) => {
    if (!name) return;
    setMainLists((prev) => {
      if (prev.some((ml) => ml.name === name)) return prev;
      return [...prev, { name, sideLists: [] }];
    });
  }, []);

  const removeMainList = useCallback(
    (name) => {
      setMainLists((prev) => prev.filter((ml) => ml.name !== name));
      if (currentMainList === name) {
        setCurrentMainList('');
        setCurrentSideList('');
      }
    },
    [currentMainList]
  );

  const renameMainList = useCallback(
    (oldName, newName) => {
      if (!newName || oldName === newName) return;
      setMainLists((prev) => {
        if (prev.some((ml) => ml.name === newName)) return prev;
        return prev.map((ml) => (ml.name === oldName ? { ...ml, name: newName } : ml));
      });
      if (currentMainList === oldName) setCurrentMainList(newName);
    },
    [currentMainList]
  );

  const switchMainList = useCallback(
    (name) => {
      const ml = mainLists.find((m) => m.name === name);
      setCurrentMainList(name);
      setCurrentSideList(ml && ml.sideLists.length > 0 ? ml.sideLists[0].listName : '');
    },
    [mainLists]
  );

  const exitToTileGrid = useCallback(() => {
    setCurrentMainList('');
    setCurrentSideList('');
  }, []);

  // --- Derived ---
  const currentMainData = useMemo(
    () => mainLists.find((ml) => ml.name === currentMainList),
    [mainLists, currentMainList]
  );

  const lists = currentMainData?.sideLists ?? [];
  const currentList = currentSideList;

  const currentListData = useMemo(() => {
    const found = lists.find((sl) => sl.listName === currentSideList);
    return found || { listName: '', tasks: [] };
  }, [lists, currentSideList]);

  // Main lists with aggregated staleness (max lastCompletedAt across side lists)
  const mainListsWithStaleness = useMemo(
    () =>
      mainLists.map((ml) => {
        let max = null;
        for (const sl of ml.sideLists) {
          if (sl.lastCompletedAt) {
            const t = new Date(sl.lastCompletedAt).getTime();
            if (max === null || t > max) max = t;
          }
        }
        return { name: ml.name, lastCompletedAt: max ? new Date(max) : null };
      }),
    [mainLists]
  );

  const contextValue = useMemo(
    () => ({
      mainLists,
      mainListsWithStaleness,
      currentMainList,
      currentMainData,
      addMainList,
      removeMainList,
      renameMainList,
      switchMainList,
      exitToTileGrid,
      lists,
      currentList,
      currentListData,
      addList,
      removeList,
      switchList,
      updateLists,
      addTask,
      removeTask,
      removeTaskByIndex,
      updateTask,
      reorderTasks,
      completeTask,
      completeTaskByIndex,
      isLoading,
      error,
    }),
    [
      mainLists,
      mainListsWithStaleness,
      currentMainList,
      currentMainData,
      addMainList,
      removeMainList,
      renameMainList,
      switchMainList,
      exitToTileGrid,
      lists,
      currentList,
      currentListData,
      addList,
      removeList,
      switchList,
      updateLists,
      addTask,
      removeTask,
      removeTaskByIndex,
      updateTask,
      reorderTasks,
      completeTask,
      completeTaskByIndex,
      isLoading,
      error,
    ]
  );

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>;
};
