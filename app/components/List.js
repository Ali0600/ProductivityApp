import { memo, useRef } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedStyle, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import GlassCard from './GlassCard';
import { tapLight, tapMedium, warning } from '../services/haptics';

const useThresholdHaptic = (progress) => {
    useAnimatedReaction(
        () => progress.value >= 1,
        (isPast, wasPast) => {
            if (isPast && !wasPast) runOnJS(tapMedium)();
        }
    );
};

const RightAction = ({ progress, onPress }) => {
    useThresholdHaptic(progress);
    const animatedStyle = useAnimatedStyle(() => {
        const p = Math.min(progress.value, 1);
        return {
            opacity: p,
            transform: [{ scale: 0.7 + 0.3 * p }],
        };
    });
    return (
        <Animated.View style={[styles.deleteBox, animatedStyle]}>
            <TouchableOpacity style={styles.actionTouch} onPress={onPress}>
                <SymbolView name="trash.fill" size={28} tintColor="white" />
            </TouchableOpacity>
        </Animated.View>
    );
};

const LeftAction = ({ progress, onPress }) => {
    useThresholdHaptic(progress);
    const animatedStyle = useAnimatedStyle(() => {
        const p = Math.min(progress.value, 1);
        return {
            opacity: p,
            transform: [{ scale: 0.7 + 0.3 * p }],
        };
    });
    return (
        <Animated.View style={[styles.moveBox, animatedStyle]}>
            <TouchableOpacity style={styles.actionTouch} onPress={onPress}>
                <SymbolView name="folder.fill" size={28} tintColor="white" />
            </TouchableOpacity>
        </Animated.View>
    );
};

const List = ({ text, drag, isActive, onSelect, onRemove, onMove }) => {
    const swipeableRef = useRef(null);

    const closeSwipe = () => {
        if (swipeableRef.current) {
            swipeableRef.current.close();
        }
    };

    const handlePress = () => {
        tapLight();
        if (onSelect) {
            onSelect(text);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete List',
            `Delete "${text}" and all its tasks?`,
            [
                { text: 'Cancel', style: 'cancel', onPress: closeSwipe },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        warning();
                        onRemove(text);
                        closeSwipe();
                    },
                },
            ]
        );
    };

    const handleMove = () => {
        if (onMove) onMove(text);
        closeSwipe();
    };

    return (
        <Swipeable
            ref={swipeableRef}
            leftThreshold={100}
            rightThreshold={100}
            onSwipeableOpen={(direction) => {
                if (direction === 'right') {
                    handleMove();
                } else if (direction === 'left') {
                    handleDelete();
                }
            }}
            renderLeftActions={(progress) => (
                <LeftAction progress={progress} onPress={handleMove} />
            )}
            renderRightActions={(progress) => (
                <RightAction progress={progress} onPress={handleDelete} />
            )}
        >
            <GlassCard
                style={[styles.listCard, isActive && styles.activeItem]}
                colorScheme="dark"
                tintColor={isActive ? 'rgba(255,255,255,0.3)' : 'rgba(46, 46, 80, 0.35)'}
            >
                <TouchableOpacity
                    onLongPress={() => { tapMedium(); drag?.(); }}
                    onPress={handlePress}
                    activeOpacity={0.7}
                    style={styles.listContainer}
                >
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <View style={styles.dragHandle} />
                        <Text style={styles.listText}>{text}</Text>
                    </View>
                </TouchableOpacity>
            </GlassCard>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    listCard: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    listContainer: {
        flexDirection: "row",
        padding: 20,
        justifyContent: "space-between"
    },
    activeItem: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    deleteBox: {
        width: 80,
        backgroundColor: 'rgba(200, 60, 60, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginVertical: 2,
        marginLeft: 8,
    },
    moveBox: {
        width: 80,
        backgroundColor: 'rgba(70, 130, 210, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginVertical: 2,
        marginRight: 8,
    },
    actionTouch: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listText: {
        color: 'white',
    },
    dragHandle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 10,
        backgroundColor: '#CCCCCC',
    }
})

export default memo(List);
