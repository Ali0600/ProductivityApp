import { useState, useCallback } from "react";
import { View, StyleSheet, Text, Modal, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, FlatList, ActivityIndicator } from "react-native";
import Task from "../components/Task";
import List from "../components/List";
import AntDesignIcons from '@expo/vector-icons/AntDesign';
import EntypoIcons from '@expo/vector-icons/Entypo';
import FeatherIcons from '@expo/vector-icons/Feather'
import moment from "moment";
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppState, useLists, useListTasks, useAppLoading } from '../hooks/useAppState';

function Homepage(props){
    const [modalVisible, setModalVisible] = useState(false);
    const [menuVisible, setMenuPanalVisible] = useState(false);
    const [taskListVisible, setTaskListVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [task, setTask] = useState('');
    const [newListName, setNewListName] = useState('');

    // Use our custom hooks
    const { isLoading, error } = useAppLoading();
    const { lists, currentList, currentListData, addList, removeList, switchList, updateLists } = useLists();
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
                        <View style={styles.modalContent}>
                            <TextInput
                                style={styles.inputForms}
                                onChangeText={text => setTask(text)}
                                placeholder={'Task Name'}
                                value={task}
                            />
                        </View>

                        <View style={styles.buttonWrapper}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <AntDesignIcons name='minuscircle' size={60} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleAddTask}>
                                <AntDesignIcons name='pluscircle' size={60} />
                            </TouchableOpacity>
                        </View>
                    </Modal>

                    <Modal visible={menuVisible} animationType="slide" transparent={true}>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <SafeAreaView style={styles.menuContainer}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white' }}>
                                <TouchableOpacity onPress={() => setMenuPanalVisible(false)}>
                                    <AntDesignIcons name='closecircle' size={40} />
                                </TouchableOpacity>

                                <Text style={{ backgroundColor: 'yellow' }}>Lists</Text>

                                <TouchableOpacity onPress={() => setTaskListVisible(true)}>
                                    <AntDesignIcons name='pluscircle' size={40} />
                                </TouchableOpacity>
                            </View>
                            
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
                                            />
                                        </ScaleDecorator>
                                    )}
                                />
                            </View>
                        </SafeAreaView>
                      </GestureHandlerRootView>

                        <Modal visible={taskListVisible} animationType="slide" transparent={true}>
                            <View style={styles.modalContent}>
                                <TextInput
                                    style={styles.inputForms}
                                    onChangeText={text => setNewListName(text)}
                                    value={newListName}
                                    placeholder={'Task List Name'}
                                />
                            </View>

                            <View style={styles.buttonWrapper}>
                                <TouchableOpacity onPress={() => setTaskListVisible(false)}>
                                    <AntDesignIcons name='minuscircle' size={60} />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleAddNewList}>
                                    <AntDesignIcons name='pluscircle' size={60} />
                                </TouchableOpacity>
                            </View>
                        </Modal>
                    </Modal>

                    <Modal visible={settingsVisible} animationType="slide" transparent={true}>
                        <View style={styles.modalContent}>
                            <Text style={styles.settingsTitle}>Notification Settings</Text>
                        </View>

                        <View style={styles.buttonWrapper}>
                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <AntDesignIcons name='closecircle' size={60} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <AntDesignIcons name='checkcircle' size={60} />
                            </TouchableOpacity>
                        </View>
                    </Modal>

                    <SafeAreaView style={styles.productName}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity onPress={() => setMenuPanalVisible(true)}>
                               <EntypoIcons name='menu' size={40} />
                            </TouchableOpacity>

                            <Text style={styles.textFont}>ADHD Habits</Text>

                            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
                               <FeatherIcons name='settings' size={40}/>
                            </TouchableOpacity>
                        </View>
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

                    <View style={styles.buttonWrapper}>
                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                            <AntDesignIcons name='pluscircle' size={60} />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView behavior="padding" />
                </>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: "black",
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
        backgroundColor: "white",
    },
    textFont: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        paddingTop: 4,
    },
    buttonWrapper: {
        position: "relative",
        width: "100%",
        paddingBottom: 35,
        paddingTop: 10,
        backgroundColor: "white",
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent:{
        backgroundColor: "white",
        flex: 1,
        margin: 20,
        marginTop: 40,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "black"
    },
    inputForms: {
        padding: 10,
        borderRadius: 1,
        borderColor: "black",
        borderWidth: 1,
    },
    menuContainer: {
        flexDirection: "column",
        flex: 1,
        justifyContent: "flex-start"
    },
    menuLists: {
        backgroundColor: "black",
        flex: 1,
    },
    settingsTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        marginTop: 10,
    }
  })

export default Homepage;