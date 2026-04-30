import { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Text, Modal, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, FlatList, ActivityIndicator, ActionSheetIOS, Alert, Switch } from "react-native";
import NotificationService from "../services/notificationService";
import Task from "../components/Task";
import List from "../components/List";
import GlassCard from "../components/GlassCard";
import AntDesignIcons from '@expo/vector-icons/AntDesign';
import EntypoIcons from '@expo/vector-icons/Entypo';
import FeatherIcons from '@expo/vector-icons/Feather'
import moment from "moment";
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppState, useLists, useListTasks, useAppLoading, useMainLists } from '../hooks/useAppState';

function Homepage(props){
    const [modalVisible, setModalVisible] = useState(false);
    const [menuVisible, setMenuPanalVisible] = useState(false);
    const [taskListVisible, setTaskListVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [task, setTask] = useState('');
    const [newListName, setNewListName] = useState('');

    useEffect(() => {
        NotificationService.getNotificationsEnabled().then(setNotificationsEnabled);
    }, []);

    const handleToggleNotifications = useCallback(async (next) => {
        setNotificationsEnabled(next);
        await NotificationService.setNotificationsEnabled(next);
    }, []);

    // Use our custom hooks
    const { isLoading, error } = useAppLoading();
    const { lists, currentList, currentListData, addList, removeList, switchList, updateLists, moveSideList } = useLists();
    const { mainLists, currentMainList, exitToTileGrid } = useMainLists();
    const {
        addTaskToList,
        reorderTasksInList,
        removeTaskFromListByIndex,
        updateTaskInList,
        completeTaskInListByIndex,
    } = useListTasks(currentList);

    const handleAddTask = () => {
        if (!task.trim()) return;

        const newTask = {
            id: `task-${Date.now()}`, // Create a reliable unique ID
            taskName: task,
            creationTime: new Date()
        };

        console.log("Adding new task:", newTask);
        addTaskToList(newTask);
        setTask(''); // Clear input
        setModalVisible(false);
    };

    const handleSwitchList = useCallback((listName) => {
        switchList(listName);
        setMenuPanalVisible(false);
    }, [switchList]);
    
    const handleReorderLists = (reorderedLists) => {
        console.log("Handling list reorder:", reorderedLists.map(l => l.listName));
        // Update the entire lists array in the context
        updateLists(reorderedLists);
    };

    const handleAddNewList = () => {
        if (!newListName.trim()) return;

        addList(newListName);
        setNewListName(''); // Clear input
        setTaskListVisible(false);
    };

    const handleMoveList = useCallback((sideListName) => {
        const targets = mainLists.filter((ml) => ml.name !== currentMainList);
        if (targets.length === 0) {
            Alert.alert('No destination', 'Create another main list before moving.');
            return;
        }
        const options = [...targets.map((ml) => ml.name), 'Cancel'];
        const cancelButtonIndex = options.length - 1;

        ActionSheetIOS.showActionSheetWithOptions(
            {
                title: `Move "${sideListName}" to...`,
                options,
                cancelButtonIndex,
            },
            (idx) => {
                if (idx === cancelButtonIndex) return;
                const target = targets[idx];
                if (!target) return;
                const ok = moveSideList(sideListName, target.name);
                if (!ok) {
                    Alert.alert(
                        'Move failed',
                        `"${target.name}" already has a list named "${sideListName}".`
                    );
                }
            }
        );
    }, [mainLists, currentMainList, moveSideList]);

    const cycleList = useCallback((direction) => {
        if (!lists || lists.length <= 1) return;
        const idx = lists.findIndex(l => l.listName === currentList);
        if (idx === -1) return;
        const nextIdx = (idx + direction + lists.length) % lists.length;
        switchList(lists[nextIdx].listName);
    }, [lists, currentList, switchList]);

    return(
        <View style={styles.container}>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Error: {error}</Text>
                </View>
            ) : (
                <>
                    <Modal visible={modalVisible} animationType="slide" transparent={true}>
                        <GlassCard style={styles.modalContent}>
                            <TextInput
                                style={styles.inputForms}
                                onChangeText={text => setTask(text)}
                                placeholder={'Task Name'}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={task}
                            />
                        </GlassCard>

                        <GlassCard style={styles.buttonWrapper}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <AntDesignIcons name='minus-circle' size={60} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleAddTask}>
                                <AntDesignIcons name='plus-circle' size={60} color="white" />
                            </TouchableOpacity>
                        </GlassCard>
                    </Modal>

                    <Modal visible={menuVisible} animationType="slide" transparent={true}>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <SafeAreaView style={styles.menuContainer}>
                            <GlassCard style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <TouchableOpacity onPress={() => setMenuPanalVisible(false)}>
                                    <AntDesignIcons name='close-circle' size={40} color="white" />
                                </TouchableOpacity>

                                <Text style={{ backgroundColor: 'yellow' }}>Lists</Text>

                                <TouchableOpacity onPress={() => setTaskListVisible(true)}>
                                    <AntDesignIcons name='plus-circle' size={40} color="white" />
                                </TouchableOpacity>
                            </GlassCard>
                            
                            <View style={styles.menuLists}>
                                <DraggableFlatList
                                    data={lists}
                                    keyExtractor={(item) => item.listName}
                                    onDragEnd={({ data }) => {
                                        console.log("Reordering lists:", data.map(l => l.listName));
                                        // Update the lists state directly in context
                                        // We need to add a function to handle this
                                        handleReorderLists(data);
                                    }}
                                    renderItem={({ item, drag, isActive }) => (
                                        <ScaleDecorator>
                                            <List
                                                text={item.listName}
                                                drag={drag}
                                                isActive={isActive}
                                                onSelect={handleSwitchList}
                                                onRemove={removeList}
                                                onMove={handleMoveList}
                                            />
                                        </ScaleDecorator>
                                    )}
                                />
                            </View>
                        </SafeAreaView>
                      </GestureHandlerRootView>

                        <Modal visible={taskListVisible} animationType="slide" transparent={true}>
                            <GlassCard style={styles.modalContent}>
                                <TextInput
                                    style={styles.inputForms}
                                    onChangeText={text => setNewListName(text)}
                                    value={newListName}
                                    placeholder={'Task List Name'}
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                />
                            </GlassCard>

                            <GlassCard style={styles.buttonWrapper}>
                                <TouchableOpacity onPress={() => setTaskListVisible(false)}>
                                    <AntDesignIcons name='minus-circle' size={60} color="white" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleAddNewList}>
                                    <AntDesignIcons name='plus-circle' size={60} color="white" />
                                </TouchableOpacity>
                            </GlassCard>
                        </Modal>
                    </Modal>

                    <Modal visible={settingsVisible} animationType="slide" transparent={true}>
                        <GlassCard style={styles.modalContent}>
                            <Text style={styles.settingsTitle}>Notification Settings</Text>

                            <View style={styles.settingsRow}>
                                <Text style={styles.settingsRowLabel}>Notifications</Text>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={handleToggleNotifications}
                                />
                            </View>
                        </GlassCard>

                        <GlassCard style={styles.buttonWrapper}>
                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <AntDesignIcons name='close-circle' size={60} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <AntDesignIcons name='check-circle' size={60} color="white" />
                            </TouchableOpacity>
                        </GlassCard>
                    </Modal>

                    <SafeAreaView style={styles.productName}>
                        <GlassCard style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => setMenuPanalVisible(true)}>
                               <EntypoIcons name='menu' size={40} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={exitToTileGrid}>
                                <Text style={styles.textFont}>ADHD Habits</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
                               <FeatherIcons name='settings' size={40} color="white"/>
                            </TouchableOpacity>
                        </GlassCard>
                    </SafeAreaView>

                    <FlatList
                        data={currentListData?.tasks ?? []}
                        keyExtractor={(item, index) => item.id || `task-${currentList}-${index}`}
                        renderItem={({ item, index }) => (
                            <Task
                                text={item.taskName}
                                index={index}
                                taskId={item.id || `task-${currentList}-${index}`}
                                creationTime={moment(item.creationTime).fromNow()}
                                onRemove={removeTaskFromListByIndex}
                                onComplete={completeTaskInListByIndex}
                                onUpdate={updateTaskInList}
                            />
                        )}
                        ListEmptyComponent={
                            <Text style={{color: 'white', padding: 20, textAlign: 'center'}}>
                                No tasks in this list
                            </Text>
                        }
                    />

                    <GlassCard style={[styles.buttonWrapper, styles.bottomNav]}>
                        <TouchableOpacity onPress={() => cycleList(-1)}>
                            <AntDesignIcons name='left-circle' size={50} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                            <AntDesignIcons name='plus-circle' size={60} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => cycleList(1)}>
                            <AntDesignIcons name='right-circle' size={50} color="white" />
                        </TouchableOpacity>
                    </GlassCard>

                    <KeyboardAvoidingView behavior="padding" />
                </>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    loadingText: {
      color: '#fff',
      marginTop: 10,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
      padding: 20,
    },
    errorText: {
      color: 'red',
      textAlign: 'center',
    },
    productName: {
        backgroundColor: "transparent",
    },
    textFont: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        paddingTop: 4,
        color: 'white',
    },
    buttonWrapper: {
        position: "relative",
        width: "100%",
        paddingBottom: 35,
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomNav: {
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    modalContent:{
        flex: 1,
        margin: 20,
        marginTop: 40,
        borderRadius: 10,
        overflow: 'hidden',
    },
    inputForms: {
        padding: 10,
        borderRadius: 1,
        borderColor: "rgba(255,255,255,0.4)",
        borderWidth: 1,
        color: 'white',
    },
    menuContainer: {
        flexDirection: "column",
        flex: 1,
        justifyContent: "flex-start"
    },
    menuLists: {
        flex: 1,
    },
    settingsTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        marginTop: 10,
        color: 'white',
    },
    settingsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    settingsRowLabel: {
        fontSize: 18,
        color: 'white',
    }
  })

export default Homepage;