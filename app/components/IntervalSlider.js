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

const DEFAULT_VALUES = [30, ...Array.from({ length: 24 }, (_, i) => (i + 1) * 60)];

export const formatMinutes = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
};

export const formatTimeOfDay = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const period = h < 12 ? 'AM' : 'PM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
};

const closestIndex = (target, values) => {
    let bestIdx = 0;
    let bestDiff = Math.abs(values[0] - target);
    for (let i = 1; i < values.length; i++) {
        const diff = Math.abs(values[i] - target);
        if (diff < bestDiff) {
            bestDiff = diff;
            bestIdx = i;
        }
    }
    return bestIdx;
};

const IntervalSlider = ({
    value,
    onChangeComplete,
    values = DEFAULT_VALUES,
    formatter = formatMinutes,
    showPrefix = true,
}) => {
    const stepCount = values.length - 1;
    const stepPx = TRACK_WIDTH / stepCount;
    const initialIndex = closestIndex(value, values);

    const offsetX = useSharedValue(initialIndex * stepPx);
    const startX = useSharedValue(0);
    const [displayValue, setDisplayValue] = useState(values[initialIndex]);

    const updateDisplay = (mins) => setDisplayValue(mins);

    const pan = Gesture.Pan()
        .onBegin(() => {
            startX.value = offsetX.value;
        })
        .onUpdate((e) => {
            const raw = Math.max(0, Math.min(TRACK_WIDTH, startX.value + e.translationX));
            const idx = Math.round(raw / stepPx);
            offsetX.value = idx * stepPx;
            runOnJS(updateDisplay)(values[idx]);
        })
        .onEnd(() => {
            const idx = Math.round(offsetX.value / stepPx);
            runOnJS(onChangeComplete)(values[idx]);
        });

    const tap = Gesture.Tap().onEnd((e) => {
        const raw = Math.max(0, Math.min(TRACK_WIDTH, e.x - THUMB_SIZE / 2));
        const idx = Math.round(raw / stepPx);
        offsetX.value = withTiming(idx * stepPx, { duration: 120 });
        runOnJS(updateDisplay)(values[idx]);
        runOnJS(onChangeComplete)(values[idx]);
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
            {showPrefix ? <Text style={styles.valuePrefix}>Every</Text> : null}
            <Text style={styles.valueLabel}>{formatter(displayValue)}</Text>
            <GestureDetector gesture={composed}>
                <View style={styles.touchArea}>
                    <View style={styles.track} />
                    <Animated.View style={[styles.trackFill, filledStyle]} />
                    <Animated.View style={[styles.thumb, thumbStyle]} />
                </View>
            </GestureDetector>
            <View style={styles.bounds}>
                <Text style={styles.boundLabel}>{formatter(values[0])}</Text>
                <Text style={styles.boundLabel}>{formatter(values[values.length - 1])}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    valuePrefix: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    valueLabel: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
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
