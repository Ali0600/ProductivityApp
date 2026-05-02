import { useState, useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet, Text, Modal, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, FlatList, ActivityIndicator, ActionSheetIOS, Alert, Switch } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolateColor,
    Easing,
} from 'react-native-reanimated';
import NotificationService from "../services/notificationService";
import Task from "../components/Task";
import List from "../components/List";
import GlassCard from "../components/GlassCard";
import IntervalSlider, { formatMinutes, formatTimeOfDay } from "../components/IntervalSlider";

const TIME_OF_DAY_VALUES = Array.from({ length: 48 }, (_, i) => i * 30);
import { SymbolView } from 'expo-symbols';
import moment from "moment";
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppState, useLists, useListTasks, useAppLoading, useMainLists } from '../hooks/useAppState';
import { tapLight, selection, warning } from '../services/haptics';

function Homepage(props){
    const [modalVisible, setModalVisible] = useState(false);
    const [menuVisible, setMenuPanalVisible] = useState(false);
    const [taskListVisible, setTaskListVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [task, setTask] = useState('');
    const [newListName, setNewListName] = useState('');
    const [messagesModalVisible, setMessagesModalVisible] = useState(false);
    const [newMessageText, setNewMessageText] = useState('');
    const [scheduledModalVisible, setScheduledModalVisible] = useState(false);
    const [scheduledList, setScheduledList] = useState([]);
    const [intervalModalVisible, setIntervalModalVisible] = useState(false);
    const [quietHoursModalVisible, setQuietHoursModalVisible] = useState(false);
    const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
    const [quietHoursStart, setQuietHoursStart] = useState(0);
    const [quietHoursEnd, setQuietHoursEnd] = useState(480);

    useEffect(() => {
        NotificationService.getNotificationsEnabled().then(setNotificationsEnabled);
        NotificationService.getQuietHours().then(({ enabled, startMinutes, endMinutes }) => {
            setQuietHoursEnabled(enabled);
            setQuietHoursStart(startMinutes);
            setQuietHoursEnd(endMinutes);
        });
    }, []);

    const handleToggleNotifications = useCallback(async (next) => {
        setNotificationsEnabled(next);
        await NotificationService.setNotificationsEnabled(next);
    }, []);

    // Use our custom hooks
    const { isLoading, error } = useAppLoading();
    const { lists, currentList, currentListData, addList, removeList, switchList, updateLists, moveSideList } = useLists();
    const { mainLists, currentMainList, exitToTileGrid, setNotificationMessages, setNotificationInterval } = useMainLists();
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
        tapLight();
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

        tapLight();
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

    const currentMessages = useMemo(() => {
        const ml = mainLists.find((m) => m.name === currentMainList);
        return ml?.notificationMessages ?? [];
    }, [mainLists, currentMainList]);

    const currentInterval = useMemo(() => {
        const ml = mainLists.find((m) => m.name === currentMainList);
        return ml?.notificationIntervalMinutes ?? 60;
    }, [mainLists, currentMainList]);

    const handleOpenMessages = useCallback(() => {
        setNewMessageText('');
        setMessagesModalVisible(true);
        setSettingsVisible(false);
        tapLight();
    }, []);

    const handleCloseMessages = useCallback(() => {
        tapLight();
        setMessagesModalVisible(false);
        setSettingsVisible(true);
    }, []);

    const persistAndReschedule = useCallback(async (next) => {
        setNotificationMessages(currentMainList, next);
        await NotificationService.setNotificationSource(currentMainList);
        await NotificationService.scheduleRecurringNotifications({
            sourceName: currentMainList,
            messages: next,
            intervalMinutes: currentInterval,
        });
    }, [currentMainList, currentInterval, setNotificationMessages]);

    const handleOpenInterval = useCallback(() => {
        tapLight();
        setIntervalModalVisible(true);
        setSettingsVisible(false);
    }, []);

    const handleCloseInterval = useCallback(() => {
        tapLight();
        setIntervalModalVisible(false);
        setSettingsVisible(true);
    }, []);

    const handleIntervalChange = useCallback(async (minutes) => {
        setNotificationInterval(currentMainList, minutes);
        selection();
        await NotificationService.setNotificationSource(currentMainList);
        await NotificationService.scheduleRecurringNotifications({
            sourceName: currentMainList,
            messages: currentMessages,
            intervalMinutes: minutes,
        });
    }, [currentMainList, currentMessages, setNotificationInterval]);

    const persistQuietHours = useCallback(async (next) => {
        await NotificationService.setQuietHours(next);
        await NotificationService.scheduleRecurringNotifications({
            sourceName: currentMainList || undefined,
            messages: currentMessages.length ? currentMessages : undefined,
            intervalMinutes: currentInterval,
        });
    }, [currentMainList, currentMessages, currentInterval]);

    const handleOpenQuietHours = useCallback(() => {
        tapLight();
        setQuietHoursModalVisible(true);
        setSettingsVisible(false);
    }, []);

    const handleCloseQuietHours = useCallback(() => {
        tapLight();
        setQuietHoursModalVisible(false);
        setSettingsVisible(true);
    }, []);

    const handleQuietToggle = useCallback(async (next) => {
        setQuietHoursEnabled(next);
        selection();
        await persistQuietHours({
            enabled: next,
            startMinutes: quietHoursStart,
            endMinutes: quietHoursEnd,
        });
    }, [quietHoursStart, quietHoursEnd, persistQuietHours]);

    const handleQuietStartChange = useCallback(async (mins) => {
        setQuietHoursStart(mins);
        selection();
        await persistQuietHours({
            enabled: quietHoursEnabled,
            startMinutes: mins,
            endMinutes: quietHoursEnd,
        });
    }, [quietHoursEnabled, quietHoursEnd, persistQuietHours]);

    const handleQuietEndChange = useCallback(async (mins) => {
        setQuietHoursEnd(mins);
        selection();
        await persistQuietHours({
            enabled: quietHoursEnabled,
            startMinutes: quietHoursStart,
            endMinutes: mins,
        });
    }, [quietHoursEnabled, quietHoursStart, persistQuietHours]);

    const handleAddMessage = useCallback(async () => {
        const trimmed = newMessageText.trim();
        if (!trimmed) return;
        tapLight();
        setNewMessageText('');
        await persistAndReschedule([...currentMessages, trimmed]);
    }, [newMessageText, currentMessages, persistAndReschedule]);

    const handleDeleteMessage = useCallback(async (idx) => {
        warning();
        await persistAndReschedule(currentMessages.filter((_, i) => i !== idx));
    }, [currentMessages, persistAndReschedule]);

    const handleOpenScheduled = useCallback(async () => {
        tapLight();
        const list = await NotificationService.getUpcomingNotifications();
        setScheduledList(list);
        setScheduledModalVisible(true);
        setSettingsVisible(false);
    }, []);

    const handleRefreshScheduled = useCallback(async () => {
        tapLight();
        const list = await NotificationService.getUpcomingNotifications();
        setScheduledList(list);
    }, []);

    const pulse = useSharedValue(0);
    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, [pulse]);

    const titleAnimatedStyle = useAnimatedStyle(() => ({
        color: interpolateColor(pulse.value, [0, 1], ['#ffffff', '#a5b4fc']),
        textShadowColor: interpolateColor(
            pulse.value,
            [0, 1],
            ['rgba(165, 180, 252, 0)', 'rgba(165, 180, 252, 0.6)']
        ),
    }));

    const cycleList = useCallback((direction) => {
        if (!lists || lists.length <= 1) return;
        const idx = lists.findIndex(l => l.listName === currentList);
        if (idx === -1) return;
        const nextIdx = (idx + direction + lists.length) % lists.length;
        selection();
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
                        <GlassCard
                            style={styles.modalContent}
                            colorScheme="dark"
                            tintColor="rgba(46, 46, 80, 0.45)"
                        >
                            <TextInput
                                style={styles.inputForms}
                                onChangeText={text => setTask(text)}
                                placeholder={'Task Name'}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={task}
                            />
                        </GlassCard>

                        <GlassCard
                            style={styles.buttonWrapper}
                            colorScheme="dark"
                            tintColor="rgba(46, 46, 80, 0.45)"
                        >
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <SymbolView name="minus.circle.fill" size={60} tintColor="white" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleAddTask}>
                                <SymbolView name="plus.circle.fill" size={60} tintColor="white" />
                            </TouchableOpacity>
                        </GlassCard>
                    </Modal>

                    <Modal visible={menuVisible} animationType="slide" transparent={true}>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <LinearGradient
                          style={{ flex: 1 }}
                          colors={['#1a1a3a', '#0f0f24', '#070712', '#000000']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                        >
                          <SafeAreaView style={styles.menuContainer}>
                            <GlassCard
                                style={styles.topBar}
                                colorScheme="dark"
                                tintColor="rgba(46, 46, 80, 0.45)"
                            >
                                <TouchableOpacity onPress={() => setMenuPanalVisible(false)}>
                                    <SymbolView name="xmark.circle.fill" size={40} tintColor="white" />
                                </TouchableOpacity>

                                <Text style={styles.drawerTitle}>Lists</Text>

                                <TouchableOpacity onPress={() => setTaskListVisible(true)}>
                                    <SymbolView name="plus.circle.fill" size={40} tintColor="white" />
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
                        </LinearGradient>
                      </GestureHandlerRootView>

                        <Modal visible={taskListVisible} animationType="slide" transparent={true}>
                            <GlassCard
                                style={styles.modalContent}
                                colorScheme="dark"
                                tintColor="rgba(46, 46, 80, 0.45)"
                            >
                                <TextInput
                                    style={styles.inputForms}
                                    onChangeText={text => setNewListName(text)}
                                    value={newListName}
                                    placeholder={'Task List Name'}
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                />
                            </GlassCard>

                            <GlassCard
                                style={styles.buttonWrapper}
                                colorScheme="dark"
                                tintColor="rgba(46, 46, 80, 0.45)"
                            >
                                <TouchableOpacity onPress={() => setTaskListVisible(false)}>
                                    <SymbolView name="minus.circle.fill" size={60} tintColor="white" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleAddNewList}>
                                    <SymbolView name="plus.circle.fill" size={60} tintColor="white" />
                                </TouchableOpacity>
                            </GlassCard>
                        </Modal>
                    </Modal>

                    <Modal visible={settingsVisible} animationType="slide" transparent={true}>
                        <GlassCard
                            style={styles.modalContent}
                            colorScheme="dark"
                            tintColor="rgba(46, 46, 80, 0.45)"
                        >
                            <Text style={styles.settingsTitle}>Notification Settings</Text>

                            <View style={styles.settingsRow}>
                                <Text style={styles.settingsRowLabel}>Notifications</Text>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={handleToggleNotifications}
                                />
                            </View>

                            {currentMainList ? (
                                <TouchableOpacity onPress={handleOpenMessages} style={styles.settingsRow}>
                                    <Text style={styles.settingsRowLabel}>Manage Messages</Text>
                                    <SymbolView name="chevron.right" size={20} tintColor="white" />
                                </TouchableOpacity>
                            ) : null}

                            {currentMainList ? (
                                <TouchableOpacity onPress={handleOpenInterval} style={styles.settingsRow}>
                                    <Text style={styles.settingsRowLabel}>Reminder Interval</Text>
                                    <View style={styles.settingsRowValue}>
                                        <Text style={styles.settingsValueText}>{formatMinutes(currentInterval)}</Text>
                                        <SymbolView name="chevron.right" size={20} tintColor="white" />
                                    </View>
                                </TouchableOpacity>
                            ) : null}

                            <TouchableOpacity onPress={handleOpenQuietHours} style={styles.settingsRow}>
                                <Text style={styles.settingsRowLabel}>Quiet Hours</Text>
                                <View style={styles.settingsRowValue}>
                                    <Text style={styles.settingsValueText}>
                                        {quietHoursEnabled
                                            ? `${formatTimeOfDay(quietHoursStart)} – ${formatTimeOfDay(quietHoursEnd)}`
                                            : 'Off'}
                                    </Text>
                                    <SymbolView name="chevron.right" size={20} tintColor="white" />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleOpenScheduled} style={styles.settingsRow}>
                                <Text style={styles.settingsRowLabel}>View Scheduled</Text>
                                <SymbolView name="chevron.right" size={20} tintColor="white" />
                            </TouchableOpacity>
                        </GlassCard>

                        <GlassCard
                            style={styles.buttonWrapper}
                            colorScheme="dark"
                            tintColor="rgba(46, 46, 80, 0.45)"
                        >
                            <TouchableOpacity onPress={() => { tapLight(); setSettingsVisible(false); }}>
                                <SymbolView name="checkmark.circle.fill" size={60} tintColor="white" />
                            </TouchableOpacity>
                        </GlassCard>
                    </Modal>

                    <Modal visible={messagesModalVisible} animationType="slide" transparent={true}>
                        <SafeAreaView style={{ flex: 1 }}>
                            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                                <GlassCard
                                    style={styles.modalContent}
                                    colorScheme="dark"
                                    tintColor="rgba(46, 46, 80, 0.45)"
                                >
                                    <Text style={styles.settingsTitle}>
                                        Messages for "{currentMainList}"
                                    </Text>
                                    <Text style={styles.messagesSubtitle}>
                                        Reminders cycle through these in order.
                                    </Text>

                                    <FlatList
                                        data={currentMessages}
                                        keyExtractor={(_, i) => `msg-${i}`}
                                        renderItem={({ item, index }) => (
                                            <View style={styles.messageRow}>
                                                <Text style={styles.messageText} numberOfLines={2}>
                                                    {item}
                                                </Text>
                                                <TouchableOpacity onPress={() => handleDeleteMessage(index)}>
                                                    <SymbolView name="trash.fill" size={22} tintColor="rgba(255,180,180,0.9)" />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                        ListEmptyComponent={
                                            <Text style={styles.messagesEmpty}>
                                                No messages yet. Add one below to start receiving reminders.
                                            </Text>
                                        }
                                    />

                                    <View style={styles.messageInputRow}>
                                        <TextInput
                                            value={newMessageText}
                                            onChangeText={setNewMessageText}
                                            placeholder="New reminder…"
                                            placeholderTextColor="rgba(255,255,255,0.5)"
                                            style={styles.messageInput}
                                            onSubmitEditing={handleAddMessage}
                                            returnKeyType="done"
                                        />
                                        <TouchableOpacity onPress={handleAddMessage}>
                                            <SymbolView name="plus.circle.fill" size={32} tintColor="white" />
                                        </TouchableOpacity>
                                    </View>
                                </GlassCard>

                                <GlassCard
                                    style={styles.buttonWrapper}
                                    colorScheme="dark"
                                    tintColor="rgba(46, 46, 80, 0.45)"
                                >
                                    <TouchableOpacity onPress={handleCloseMessages}>
                                        <SymbolView name="checkmark.circle.fill" size={60} tintColor="white" />
                                    </TouchableOpacity>
                                </GlassCard>
                            </KeyboardAvoidingView>
                        </SafeAreaView>
                    </Modal>

                    <Modal visible={scheduledModalVisible} animationType="slide" transparent={true}>
                        <SafeAreaView style={{ flex: 1 }}>
                            <GlassCard
                                style={styles.modalContent}
                                colorScheme="dark"
                                tintColor="rgba(46, 46, 80, 0.45)"
                            >
                                <View style={styles.scheduledHeader}>
                                    <Text style={styles.settingsTitle}>Scheduled Notifications</Text>
                                    <TouchableOpacity onPress={handleRefreshScheduled} style={styles.refreshButton}>
                                        <SymbolView name="arrow.clockwise.circle.fill" size={28} tintColor="white" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.messagesSubtitle}>
                                    {scheduledList.length} pending — soonest first.
                                </Text>

                                <FlatList
                                    data={scheduledList}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => (
                                        <View style={styles.scheduledRow}>
                                            <Text style={styles.scheduledTime}>
                                                {moment(item.fireTime).fromNow()}
                                            </Text>
                                            <Text style={styles.scheduledAbsolute}>
                                                {moment(item.fireTime).format('ddd h:mm A')}
                                            </Text>
                                            <Text style={styles.scheduledBody} numberOfLines={2}>
                                                {item.body}
                                            </Text>
                                        </View>
                                    )}
                                    ListEmptyComponent={
                                        <Text style={styles.messagesEmpty}>
                                            No notifications scheduled.
                                        </Text>
                                    }
                                />
                            </GlassCard>

                            <GlassCard
                                style={styles.buttonWrapper}
                                colorScheme="dark"
                                tintColor="rgba(46, 46, 80, 0.45)"
                            >
                                <TouchableOpacity onPress={() => setScheduledModalVisible(false)}>
                                    <SymbolView name="xmark.circle.fill" size={60} tintColor="white" />
                                </TouchableOpacity>
                            </GlassCard>
                        </SafeAreaView>
                    </Modal>

                    <Modal visible={intervalModalVisible} animationType="slide" transparent={true}>
                        <SafeAreaView style={{ flex: 1 }}>
                            <GlassCard
                                style={styles.modalContent}
                                colorScheme="dark"
                                tintColor="rgba(46, 46, 80, 0.45)"
                            >
                                <Text style={styles.settingsTitle}>Reminder Interval</Text>
                                <Text style={styles.messagesSubtitle}>
                                    How often "{currentMainList}" sends reminders.
                                </Text>
                                <IntervalSlider
                                    key={`interval-${currentInterval}`}
                                    value={currentInterval}
                                    onChangeComplete={handleIntervalChange}
                                />
                            </GlassCard>

                            <GlassCard
                                style={styles.buttonWrapper}
                                colorScheme="dark"
                                tintColor="rgba(46, 46, 80, 0.45)"
                            >
                                <TouchableOpacity onPress={handleCloseInterval}>
                                    <SymbolView name="checkmark.circle.fill" size={60} tintColor="white" />
                                </TouchableOpacity>
                            </GlassCard>
                        </SafeAreaView>
                    </Modal>

                    <Modal visible={quietHoursModalVisible} animationType="slide" transparent={true}>
                        <SafeAreaView style={{ flex: 1 }}>
                            <GlassCard
                                style={styles.modalContent}
                                colorScheme="dark"
                                tintColor="rgba(46, 46, 80, 0.45)"
                            >
                                <Text style={styles.settingsTitle}>Quiet Hours</Text>
                                <Text style={styles.messagesSubtitle}>
                                    No notifications fire during this window.
                                </Text>

                                <View style={styles.settingsRow}>
                                    <Text style={styles.settingsRowLabel}>Enabled</Text>
                                    <Switch value={quietHoursEnabled} onValueChange={handleQuietToggle} />
                                </View>

                                {quietHoursEnabled ? (
                                    <>
                                        <Text style={styles.quietHeading}>Start</Text>
                                        <IntervalSlider
                                            key={`start-${quietHoursStart}`}
                                            value={quietHoursStart}
                                            onChangeComplete={handleQuietStartChange}
                                            values={TIME_OF_DAY_VALUES}
                                            formatter={formatTimeOfDay}
                                            showPrefix={false}
                                        />
                                        <Text style={styles.quietHeading}>End</Text>
                                        <IntervalSlider
                                            key={`end-${quietHoursEnd}`}
                                            value={quietHoursEnd}
                                            onChangeComplete={handleQuietEndChange}
                                            values={TIME_OF_DAY_VALUES}
                                            formatter={formatTimeOfDay}
                                            showPrefix={false}
                                        />
                                    </>
                                ) : null}
                            </GlassCard>

                            <GlassCard
                                style={styles.buttonWrapper}
                                colorScheme="dark"
                                tintColor="rgba(46, 46, 80, 0.45)"
                            >
                                <TouchableOpacity onPress={handleCloseQuietHours}>
                                    <SymbolView name="checkmark.circle.fill" size={60} tintColor="white" />
                                </TouchableOpacity>
                            </GlassCard>
                        </SafeAreaView>
                    </Modal>

                    <SafeAreaView style={styles.productName}>
                        <GlassCard
                            style={styles.topBar}
                            tintColor="rgba(46, 46, 80, 0.45)"
                            colorScheme="dark"
                        >
                            <TouchableOpacity onPress={() => setMenuPanalVisible(true)}>
                               <SymbolView name="line.3.horizontal" size={40} tintColor="white" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={exitToTileGrid}>
                                <Animated.Text
                                    style={[styles.textFont, styles.titleGlow, titleAnimatedStyle]}
                                    numberOfLines={1}
                                >
                                    {currentList || currentMainList}
                                </Animated.Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
                               <SymbolView name="gearshape" size={40} tintColor="white" />
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

                    <GlassCard
                        style={styles.bottomNav}
                        tintColor="rgba(46, 46, 80, 0.45)"
                        colorScheme="dark"
                    >
                        <TouchableOpacity onPress={() => cycleList(-1)}>
                            <SymbolView name="chevron.left.circle.fill" size={50} tintColor="white" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                            <SymbolView name="plus.circle.fill" size={60} tintColor="white" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => cycleList(1)}>
                            <SymbolView name="chevron.right.circle.fill" size={50} tintColor="white" />
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
    titleGlow: {
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
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
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 28,
        overflow: 'hidden',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginHorizontal: 12,
        marginBottom: 35,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 32,
        overflow: 'hidden',
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
    drawerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
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
    },
    settingsRowValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingsValueText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
    },
    quietHeading: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 16,
        marginBottom: 4,
        textAlign: 'center',
    },
    messagesSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 12,
        fontSize: 13,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.15)',
    },
    messageText: {
        color: 'white',
        flex: 1,
        marginRight: 12,
    },
    messagesEmpty: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        paddingVertical: 24,
        fontStyle: 'italic',
    },
    messageInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        gap: 10,
    },
    messageInput: {
        flex: 1,
        color: 'white',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    scheduledHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    refreshButton: {
        position: 'absolute',
        right: 16,
    },
    scheduledRow: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.15)',
    },
    scheduledTime: {
        color: '#a5b4fc',
        fontSize: 13,
        fontWeight: '600',
    },
    scheduledAbsolute: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        marginTop: 2,
    },
    scheduledBody: {
        color: 'white',
        fontSize: 15,
        marginTop: 4,
    },
  })

export default Homepage;