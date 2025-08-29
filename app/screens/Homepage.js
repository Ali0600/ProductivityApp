import { useEffect, useState } from "react";
import { View, StyleSheet, Text, Modal, SafeAreaView, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from "react-native";
import Task from "../components/Task";
import List from "../components/List";
import AntDesignIcons from '@expo/vector-icons/AntDesign';
import EntypoIcons from '@expo/vector-icons/Entypo';
import FeatherIcons from '@expo/vector-icons/Feather'
import moment from "moment";
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useAppState, useLists, useListTasks, useAppLoading, useNotifications } from '../hooks/useAppState';
import NotificationService from '../services/notificationService';
import FirebaseService from '../services/firebaseService';

function Homepage(props){
    const [modalVisible, setModalVisible] = useState(false);
    const [menuVisible, setMenuPanalVisible] = useState(false);
    const [taskListVisible, setTaskListVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [currentTime, setCurrentTime] = useState(moment());
    const [task, setTask] = useState('');
    const [newListName, setNewListName] = useState('');
    const [is60SecRunning, setIs60SecRunning] = useState(false);
    const [is10MinRunning, setIs10MinRunning] = useState(false);
    const [is1HourRunning, setIs1HourRunning] = useState(false);
    const [isTestRunning, setIsTestRunning] = useState(false);
    const [firebase60SecRunning, setFirebase60SecRunning] = useState(false);
    const [firebase10MinRunning, setFirebase10MinRunning] = useState(false);
    const [firebase1HourRunning, setFirebase1HourRunning] = useState(false);
    
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

    const saveNotificationSettings = () => {
        // For now, this is a placeholder - you can expand this later
        console.log("Notification settings saved");
    };

    const handleToggle60SecNotifications = async () => {
        try {
            if (is60SecRunning) {
                // Stop notifications
                const result = await NotificationService.stop60SecondNotifications();
                console.log("60-second notifications stopped:", result);
                setIs60SecRunning(false);
                alert("60-second notifications stopped!");
            } else {
                // Start notifications
                const result = await NotificationService.start60SecondNotifications();
                console.log("60-second notifications started:", result);
                setIs60SecRunning(true);
                alert("60-second notifications started!");
            }
        } catch (error) {
            console.error("Error toggling 60-second notifications:", error);
            alert("Error toggling 60-second notifications: " + error.message);
        }
    };

    const handleToggle10MinNotifications = async () => {
        try {
            if (is10MinRunning) {
                // Stop notifications
                const result = await NotificationService.stop10MinuteNotifications();
                console.log("10-minute notifications stopped:", result);
                setIs10MinRunning(false);
                alert("10-minute notifications stopped!");
            } else {
                // Start notifications
                const result = await NotificationService.start10MinuteNotifications();
                console.log("10-minute notifications started:", result);
                setIs10MinRunning(true);
                alert("10-minute notifications started!");
            }
        } catch (error) {
            console.error("Error toggling 10-minute notifications:", error);
            alert("Error toggling 10-minute notifications: " + error.message);
        }
    };

    const handleToggle1HourNotifications = async () => {
        try {
            if (is1HourRunning) {
                // Stop notifications
                const result = await NotificationService.stop1HourNotifications();
                console.log("1-hour notifications stopped:", result);
                setIs1HourRunning(false);
                alert("1-hour notifications stopped!");
            } else {
                // Start notifications
                const result = await NotificationService.start1HourNotifications();
                console.log("1-hour notifications started:", result);
                setIs1HourRunning(true);
                alert("1-hour notifications started!");
            }
        } catch (error) {
            console.error("Error toggling 1-hour notifications:", error);
            alert("Error toggling 1-hour notifications: " + error.message);
        }
    };

    const handleRequestPermissions = async () => {
        try {
            const hasPermission = await NotificationService.registerForLocalNotificationsAsync();
            if (hasPermission) {
                alert("Local notification permissions granted!");
            } else {
                alert("Local notification permission denied");
            }
        } catch (error) {
            console.error("Error requesting permissions:", error);
            alert("Error requesting permissions: " + error.message);
        }
    };

    const handleTestNotificationHandler = async () => {
        try {
            console.log("Testing notification handler...");
            await FirebaseService.testNotificationHandler();
        } catch (error) {
            console.error("Error testing notification handler:", error);
            alert("Error testing handler: " + error.message);
        }
    };

    const handleToggleTestNotifications = async () => {
        try {
            if (isTestRunning) {
                // Stop test notifications
                const result = await NotificationService.stopTestNotifications();
                console.log("Test notifications stopped:", result);
                setIsTestRunning(false);
                alert("Test notifications stopped!");
            } else {
                // Start test notifications
                const result = await NotificationService.startTestNotifications();
                console.log("Test notifications started:", result);
                setIsTestRunning(true);
                alert("Test notifications started! (30 seconds)");
            }
        } catch (error) {
            console.error("Error toggling test notifications:", error);
            alert("Error toggling test notifications: " + error.message);
        }
    };

    const handleToggleFirebase60Sec = async () => {
        console.log("handleToggleFirebase60Sec called, current state:", firebase60SecRunning);
        try {
            if (firebase60SecRunning) {
                console.log("Stopping Firebase 60s notifications...");
                const result = await FirebaseService.stopNotifications('60s');
                console.log("Firebase 60s notifications stopped:", result);
                if (result) {
                    setFirebase60SecRunning(false);
                    alert("Firebase 60s notifications stopped!");
                } else {
                    alert("Failed to stop Firebase 60s notifications");
                }
            } else {
                console.log("TEMPORARILY DISABLED - Testing Firebase Console direct notifications");
                alert("Server notifications disabled - test Firebase Console instead");
                // Temporarily disabled to test Firebase Console notifications
                // const result = await FirebaseService.startNotifications('60s');
            }
        } catch (error) {
            console.error("Error toggling Firebase 60s notifications:", error);
            alert("Error toggling Firebase 60s notifications: " + error.message);
        }
    };

    const handleToggleFirebase10Min = async () => {
        try {
            if (firebase10MinRunning) {
                const result = await FirebaseService.stopNotifications('10m');
                console.log("Firebase 10min notifications stopped:", result);
                setFirebase10MinRunning(false);
                alert("Firebase 10min notifications stopped!");
            } else {
                console.log("TEMPORARILY DISABLED - Testing Firebase Console direct notifications");
                alert("Server notifications disabled - test Firebase Console instead");
                // Temporarily disabled to test Firebase Console notifications
                // const result = await FirebaseService.startNotifications('10m');
            }
        } catch (error) {
            console.error("Error toggling Firebase 10min notifications:", error);
            alert("Error toggling Firebase 10min notifications: " + error.message);
        }
    };

    const handleToggleFirebase1Hour = async () => {
        try {
            if (firebase1HourRunning) {
                const result = await FirebaseService.stopNotifications('1h');
                console.log("Firebase 1h notifications stopped:", result);
                setFirebase1HourRunning(false);
                alert("Firebase 1h notifications stopped!");
            } else {
                console.log("TEMPORARILY DISABLED - Testing Firebase Console direct notifications");
                alert("Server notifications disabled - test Firebase Console instead");
                // Temporarily disabled to test Firebase Console notifications
                // const result = await FirebaseService.startNotifications('1h');
            }
        } catch (error) {
            console.error("Error toggling Firebase 1h notifications:", error);
            alert("Error toggling Firebase 1h notifications: " + error.message);
        }
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

                    <Modal visible={settingsVisible} animationType="slide" transparent={true}>
                        <View style={styles.modalContent}>
                            <Text style={styles.settingsTitle}>Notification Settings</Text>
                            
                            <View style={styles.debugSection}>
                                <Text style={styles.debugTitle}>Debug Notifications</Text>
                                
                                <TouchableOpacity style={styles.debugButton} onPress={handleRequestPermissions}>
                                    <Text style={styles.debugButtonText}>Request Permissions</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.debugButton, {backgroundColor: '#FF6B6B'}]} onPress={handleTestNotificationHandler}>
                                    <Text style={styles.debugButtonText}>🧪 Test Notification Handler</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={styles.debugButton} onPress={async () => {
                                    try {
                                        const status = await FirebaseService.getStatus();
                                        alert(`Firebase Status:\nHas Token: ${status.hasToken}\nToken: ${status.token || 'None'}\nServer: ${status.serverUrl}\nError: ${status.error || 'None'}`);
                                    } catch (error) {
                                        alert(`Error getting Firebase status: ${error.message}`);
                                    }
                                }}>
                                    <Text style={styles.debugButtonText}>Check Firebase Status</Text>
                                </TouchableOpacity>
                                
                                <Text style={styles.sectionTitle}>Local Notifications (Current)</Text>
                                <TouchableOpacity style={[styles.debugButton, isTestRunning && styles.debugButtonActive]} onPress={handleToggleTestNotifications}>
                                    <Text style={styles.debugButtonText}>
                                        {isTestRunning ? 'Stop Test (30s)' : 'Start Test (30s)'}
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={[styles.debugButton, is60SecRunning && styles.debugButtonActive]} onPress={handleToggle60SecNotifications}>
                                    <Text style={styles.debugButtonText}>
                                        {is60SecRunning ? 'Stop Local 60-Sec' : 'Start Local 60-Sec'}
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={[styles.debugButton, is10MinRunning && styles.debugButtonActive]} onPress={handleToggle10MinNotifications}>
                                    <Text style={styles.debugButtonText}>
                                        {is10MinRunning ? 'Stop Local 10-Min' : 'Start Local 10-Min'}
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={[styles.debugButton, is1HourRunning && styles.debugButtonActive]} onPress={handleToggle1HourNotifications}>
                                    <Text style={styles.debugButtonText}>
                                        {is1HourRunning ? 'Stop Local 1-Hour' : 'Start Local 1-Hour'}
                                    </Text>
                                </TouchableOpacity>

                                <Text style={styles.sectionTitle}>Firebase Notifications (Background)</Text>
                                <TouchableOpacity style={[styles.debugButton, firebase60SecRunning && styles.debugButtonActive]} onPress={handleToggleFirebase60Sec}>
                                    <Text style={styles.debugButtonText}>
                                        {firebase60SecRunning ? 'Stop Firebase 60-Sec' : 'Start Firebase 60-Sec'}
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={[styles.debugButton, firebase10MinRunning && styles.debugButtonActive]} onPress={handleToggleFirebase10Min}>
                                    <Text style={styles.debugButtonText}>
                                        {firebase10MinRunning ? 'Stop Firebase 10-Min' : 'Start Firebase 10-Min'}
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={[styles.debugButton, firebase1HourRunning && styles.debugButtonActive]} onPress={handleToggleFirebase1Hour}>
                                    <Text style={styles.debugButtonText}>
                                        {firebase1HourRunning ? 'Stop Firebase 1-Hour' : 'Start Firebase 1-Hour'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.buttonWrapper}>
                            <TouchableOpacity>
                                <AntDesignIcons name='closecircle' size={60} onPress={() => setSettingsVisible(false)} />
                            </TouchableOpacity>

                            <TouchableOpacity>
                                <AntDesignIcons name='checkcircle' size={60} onPress={() => {
                                    // Save the settings
                                    saveNotificationSettings();
                                    setSettingsVisible(false);
                                }}/>
                            </TouchableOpacity>
                        </View>
                    </Modal>

                    <SafeAreaView style={styles.productName}>
                        <View flexDirection="row" justifyContent="space-between">
                            <TouchableOpacity>
                               <EntypoIcons name='menu' size={40} onPress={() => setMenuPanalVisible(true)}/>
                            </TouchableOpacity>

                            <Text style={styles.textFont}>ADHDone</Text>

                            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
                               <FeatherIcons name='settings' size={40}/>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    <ScrollView>
                        {currentListData && currentListData.tasks && currentListData.tasks.length > 0 ? (
                            currentListData.tasks.map((task, index) => {
                                //console.log("Rendering task:", task);
                                const taskId = task.id || `task-${currentList}-${index}`;
                                //console.log("Using taskId:", taskId);
                                
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
    },
    settingsTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        marginTop: 10,
    },
    settingsLabel: {
        fontSize: 16,
        marginLeft: 10,
        marginBottom: 5,
    },
    settingsDescription: {
        fontSize: 14,
        color: "gray",
        marginTop: 10,
        marginLeft: 10,
        marginRight: 10,
        textAlign: "center",
    },
    debugSection: {
        padding: 20,
        backgroundColor: "#f5f5f5",
        margin: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    debugTitle: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 15,
        color: "#333",
    },
    debugButton: {
        backgroundColor: "#007AFF",
        padding: 12,
        borderRadius: 8,
        marginVertical: 5,
        alignItems: "center",
    },
    debugButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    debugButtonActive: {
        backgroundColor: "#FF3B30",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#007AFF",
        marginTop: 15,
        marginBottom: 5,
        textAlign: "center",
    }
  })

export default Homepage;

//                                 <Text style={{ color: listName === currentList ? "red" : "white" }}>{listName}</Text>