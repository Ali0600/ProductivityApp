import { useEffect, useState } from "react";
import { View, StyleSheet, Text, Modal, SafeAreaView, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from "react-native";
import Task from "../components/Task";
import List from "../components/List";
import AntDesignIcons from '@expo/vector-icons/AntDesign';
import EntypoIcons from '@expo/vector-icons/Entypo';
import FeatherIcons from '@expo/vector-icons/Feather'
import moment from "moment";
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useAppState, useLists, useListTasks, useAppLoading } from '../hooks/useAppState';

function Homepage(props){
    const [modalVisible, setModalVisible] = useState(false);
    const [menuVisible, setMenuPanalVisible] = useState(false);
    const [taskListVisible, setTaskListVisible] = useState(false);
    const [currentTime, setCurrentTime] = useState(moment());
    const [task, setTask] = useState('');
    const [newListName, setNewListName] = useState('');
    
    // Use our custom hooks
    const { isLoading, error } = useAppLoading();
    const { lists, currentList, currentListData, addList, removeList, switchList, updateLists } = useLists();
    const { addTaskToList, reorderTasksInList } = useListTasks(currentList);

    // This useEffect is used to update the current time every 10 seconds
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(moment());
        }, 10000);

        return() => clearInterval(intervalId);
    }, []);

    const handleAddTask = () => {
        if (!task.trim()) return;
        
        const newTask = {
            id: `task-${Date.now()}`, // Create a reliable unique ID
            taskName: task, 
            creationTime: currentTime.toDate()
        };
        
        console.log("Adding new task:", newTask);
        addTaskToList(newTask);
        setTask(''); // Clear input
        setModalVisible(false);
    };

    const handleSwitchList = (listName) => {
        switchList(listName);
        setMenuPanalVisible(false);
    };
    
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
                            <TouchableOpacity>
                                <AntDesignIcons name='minuscircle' size={60} onPress={() => setModalVisible(false) }/>
                            </TouchableOpacity>

                            <TouchableOpacity>
                                <AntDesignIcons name='pluscircle' size={60} onPress={handleAddTask}/>
                            </TouchableOpacity>
                        </View>
                    </Modal>

                    <Modal visible={menuVisible} animationType="slide" transparent={true}>
                        <SafeAreaView style={styles.menuContainer}>
                            <View flexDirection="row" justifyContent="space-between" backgroundColor="white">
                                <AntDesignIcons 
                                    name='closecircle' 
                                    size={40} 
                                    backgroundColor='white' 
                                    onPress={() => setMenuPanalVisible(false)}
                                />

                                <Text backgroundColor="yellow">Lists</Text>

                                <AntDesignIcons 
                                    name='pluscircle' 
                                    size={40} 
                                    onPress={() => setTaskListVisible(true)}
                                />
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
                                    renderItem={({ item, drag, isActive, index }) => (
                                        <ScaleDecorator>
                                            <List
                                                text={item.listName}
                                                index={index}
                                                drag={drag}
                                                isActive={isActive}
                                                onListPress={() => handleSwitchList(item.listName)}
                                            />
                                        </ScaleDecorator>
                                    )}
                                />
                            </View>
                        </SafeAreaView>

                        <Modal visible={taskListVisible} animationType="slide" transparent={true}>
                            <View style={styles.taskListModal}>
                                <TextInput
                                    style={styles.inputForms}
                                    onChangeText={text => setNewListName(text)}
                                    value={newListName}
                                    placeholder={'Task List Name'}
                                />
                            </View>

                            <View style={styles.buttonWrapper}>
                                <TouchableOpacity>
                                    <AntDesignIcons 
                                        name='minuscircle' 
                                        size={60} 
                                        onPress={() => setTaskListVisible(false)}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity>
                                    <AntDesignIcons 
                                        name='pluscircle' 
                                        size={60} 
                                        onPress={handleAddNewList}
                                    />
                                </TouchableOpacity>
                            </View>
                        </Modal>
                    </Modal>

                    <SafeAreaView style={styles.productName}>
                        <View flexDirection="row" justifyContent="space-between">
                            <TouchableOpacity>
                               <EntypoIcons name='menu' size={40} onPress={() => setMenuPanalVisible(true)}/>
                            </TouchableOpacity>

                            <Text style={styles.textFont}>ADHDone</Text>

                            <TouchableOpacity>
                               <FeatherIcons name='settings' size={40}/>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    <ScrollView>
                        {currentListData && currentListData.tasks && currentListData.tasks.length > 0 ? (
                            currentListData.tasks.map((task, index) => {
                                console.log("Rendering task:", task);
                                const taskId = task.id || `task-${currentList}-${index}`;
                                console.log("Using taskId:", taskId);
                                
                                return (
                                    <Task
                                        text={task.taskName}
                                        key={taskId}
                                        index={index}
                                        taskId={taskId}
                                        creationTime={moment(task.creationTime).fromNow()}
                                        currentListName={currentList}
                                    />
                                );
                            })
                        ) : (
                            <Text style={{color: 'white', padding: 20, textAlign: 'center'}}>
                                No tasks in this list
                            </Text>
                        )}
                    </ScrollView>

                    <View style={styles.buttonWrapper}>
                        <TouchableOpacity>
                            <AntDesignIcons 
                                name='pluscircle' 
                                size={60} 
                                onPress={() => setModalVisible(true)}
                            />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} />
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
    taskListModal:{
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
        justifyContent: 'center',
        flexDirection: "column",
        flex: 1,
        justifyContent: "flex-start"
    },
    menuLists: {
        backgroundColor: "black",
        flex: 1,
    },
    listWrapper: {
        position: "relative",
        width: "100%",
        paddingBottom: 35,
        paddingTop: 10,
        backgroundColor: "white",
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    }
  })

export default Homepage;

//                                 <Text style={{ color: listName === currentList ? "red" : "white" }}>{listName}</Text>