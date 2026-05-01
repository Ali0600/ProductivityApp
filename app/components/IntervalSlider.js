import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    runOnJS,
    withTiming,
} from 'react-native-reanimated';

const TRACK_WIDTH = 280;
const THUMB_SIZE = 24;

export const formatMinutes = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
};

const IntervalSlider = ({
    value,
    onChangeComplete,
    minMinutes = 30,
    maxMinutes = 1440,
    stepMinutes = 30,
}) => {
    const stepCount = (maxMinutes - minMinutes) / stepMinutes;
    const stepPx = TRACK_WIDTH / stepCount;
    const initialOffset = ((value - minMinutes) / stepMinutes) * stepPx;

    const offsetX = useSharedValue(initialOffset);
    const startX = useSharedValue(0);
    const [displayValue, setDisplayValue] = useState(value);

    const updateDisplay = (mins) => setDisplayValue(mins);

    const pan = Gesture.Pan()
        .onBegin(() => {
            startX.value = offsetX.value;
        })
        .onUpdate((e) => {
            const raw = Math.max(0, Math.min(TRACK_WIDTH, startX.value + e.translationX));
            const snapped = Math.round(raw / stepPx) * stepPx;
            offsetX.value = snapped;
            const mins = minMinutes + Math.round(snapped / stepPx) * stepMinutes;
            runOnJS(updateDisplay)(mins);
        })
        .onEnd(() => {
            const mins = minMinutes + Math.round(offsetX.value / stepPx) * stepMinutes;
            runOnJS(onChangeComplete)(mins);
        });

    const tap = Gesture.Tap().onEnd((e) => {
        const raw = Math.max(0, Math.min(TRACK_WIDTH, e.x - THUMB_SIZE / 2));
        const snapped = Math.round(raw / stepPx) * stepPx;
        offsetX.value = withTiming(snapped, { duration: 120 });
        const mins = minMinutes + Math.round(snapped / stepPx) * stepMinutes;
        runOnJS(updateDisplay)(mins);
        runOnJS(onChangeComplete)(mins);
    });

    const composed = Gesture.Race(pan, tap);

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: offsetX.value }],
    }));

    const filledStyle = useAnimatedStyle(() => ({
        width: offsetX.value + THUMB_SIZE / 2,
    }));

    return (
        <View style={styles.container}>
            <Text style={styles.valueLabel}>Every {formatMinutes(displayValue)}</Text>
            <GestureDetector gesture={composed}>
                <View style={styles.touchArea}>
                    <View style={styles.track} />
                    <Animated.View style={[styles.trackFill, filledStyle]} />
                    <Animated.View style={[styles.thumb, thumbStyle]} />
                </View>
            </GestureDetector>
            <View style={styles.bounds}>
                <Text style={styles.boundLabel}>{formatMinutes(minMinutes)}</Text>
                <Text style={styles.boundLabel}>{formatMinutes(maxMinutes)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    valueLabel: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
    },
    touchArea: {
        width: TRACK_WIDTH + THUMB_SIZE,
        height: 40,
        justifyContent: 'center',
        paddingHorizontal: THUMB_SIZE / 2,
    },
    track: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
    },
    trackFill: {
        position: 'absolute',
        left: THUMB_SIZE / 2,
        height: 4,
        backgroundColor: '#a5b4fc',
        borderRadius: 2,
    },
    thumb: {
        position: 'absolute',
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    bounds: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: TRACK_WIDTH,
        marginTop: 8,
    },
    boundLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    },
});

export default IntervalSlider;
