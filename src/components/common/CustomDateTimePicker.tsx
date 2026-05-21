import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, FlatList } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface CustomDateTimePickerProps {
    visible: boolean;
    initialDate: Date;
    onClose: () => void;
    onSave: (date: Date) => void;
    disableTime?: boolean;
    isRange?: boolean;
    initialStartDate?: Date | null;
    initialEndDate?: Date | null;
    onSaveRange?: (start: Date, end: Date) => void;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
    visible,
    initialDate,
    onClose,
    onSave,
    disableTime = false,
    isRange = false,
    initialStartDate = null,
    initialEndDate = null,
    onSaveRange
}) => {
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;

    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [rangeStart, setRangeStart] = useState<Date | null>(initialStartDate);
    const [rangeEnd, setRangeEnd] = useState<Date | null>(initialEndDate);
    const [mode, setMode] = useState<'date' | 'time'>('date');

    const [hour, setHour] = useState(initialDate.getHours() % 12 || 12);
    const [minute, setMinute] = useState(initialDate.getMinutes());
    const [ampm, setAmpm] = useState(initialDate.getHours() >= 12 ? 'PM' : 'AM');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 7);

    // Generate calendar days for current month
    const getDaysInMonth = (year: number, month: number) => {
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const currentMonthDays = getDaysInMonth(today.getFullYear(), today.getMonth());
    const nextMonthDays = getDaysInMonth(today.getFullYear(), today.getMonth() + 1);
    const allDays = [...currentMonthDays, ...nextMonthDays].filter(d => d <= maxDate);

    // Padding for first day of month
    const firstDayIndex = currentMonthDays[0].getDay();
    const calendarPadding = Array(firstDayIndex).fill(null);

    const handleSave = () => {
        if (isRange) {
            const start = rangeStart || selectedDate;
            const end = rangeEnd || start;
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            onSaveRange?.(start, end);
            onClose();
            return;
        }

        const finalDate = new Date(selectedDate);
        if (!disableTime) {
            let h = hour % 12;
            if (ampm === 'PM') h += 12;
            finalDate.setHours(h);
            finalDate.setMinutes(minute);
        } else {
            finalDate.setHours(0, 0, 0, 0);
        }
        onSave(finalDate);
        onClose();
    };

    const isDateSelectable = (d: Date) => {
        return d >= today && d <= maxDate;
    };

    const renderCalendar = () => {
        const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        return (
            <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                    <Text style={[styles.calendarMonth, { color: Colors.textPrimary }]}>
                        {today.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                    </Text>
                    <View style={styles.limitBadge}>
                        <Text style={styles.limitText}>7 Day Limit</Text>
                    </View>
                </View>
                <View style={styles.weekdaysRow}>
                    {weekdays.map((d, i) => (
                        <Text key={i} style={[styles.weekdayText, { color: Colors.textMuted }]}>{d}</Text>
                    ))}
                </View>
                <View style={styles.daysGrid}>
                    {calendarPadding.map((_, i) => <View key={`pad-${i}`} style={styles.dayBox} />)}
                    {allDays.map((d, i) => {
                        const isSelected = isRange
                            ? (rangeStart && d.toDateString() === rangeStart.toDateString()) || (rangeEnd && d.toDateString() === rangeEnd.toDateString())
                            : d.toDateString() === selectedDate.toDateString();
                            
                        const isInRange = isRange && rangeStart && rangeEnd && d > rangeStart && d < rangeEnd;
                        const selectable = isDateSelectable(d);
                        
                        const handlePress = () => {
                            if (isRange) {
                                if (!rangeStart || (rangeStart && rangeEnd)) {
                                    setRangeStart(d);
                                    setRangeEnd(null);
                                } else if (rangeStart && !rangeEnd) {
                                    if (d < rangeStart) {
                                        setRangeStart(d);
                                    } else {
                                        setRangeEnd(d);
                                    }
                                }
                            } else {
                                setSelectedDate(d);
                            }
                        };

                        let customBorderRadiusStyle: any = { borderRadius: 12 };
                        if (isRange && rangeStart && rangeEnd) {
                            if (d.toDateString() === rangeStart.toDateString()) {
                                customBorderRadiusStyle = {
                                    borderTopLeftRadius: 12,
                                    borderBottomLeftRadius: 12,
                                    borderTopRightRadius: 0,
                                    borderBottomRightRadius: 0,
                                };
                            } else if (d.toDateString() === rangeEnd.toDateString()) {
                                customBorderRadiusStyle = {
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0,
                                    borderTopRightRadius: 12,
                                    borderBottomRightRadius: 12,
                                };
                            }
                        }

                        return (
                            <TouchableOpacity
                                key={i}
                                disabled={!selectable}
                                onPress={handlePress}
                                style={[
                                    styles.dayBox,
                                    isSelected && { backgroundColor: Colors.primary, ...customBorderRadiusStyle },
                                    isInRange && { backgroundColor: Colors.primary + '30', borderRadius: 0 },
                                    !selectable && { opacity: 0.2 }
                                ]}
                            >
                                <Text style={[
                                    styles.dayText,
                                    { color: isSelected ? '#FFF' : (isInRange ? Colors.primary : Colors.textPrimary) },
                                    !selectable && { color: Colors.textMuted }
                                ]}>
                                    {d.getDate()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderTimePicker = () => {
        const hours = Array.from({ length: 12 }).map((_, i) => i + 1);
        const mins = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

        return (
            <View style={styles.timePickerContainer}>
                {/* Hour Grid */}
                <Text style={[styles.wheelLabel, { color: Colors.textMuted, alignSelf: 'center', marginBottom: 8 }]}>HOUR</Text>
                <View style={styles.chipGrid}>
                    {hours.map(h => (
                        <TouchableOpacity
                            key={h}
                            activeOpacity={0.7}
                            onPress={() => setHour(h)}
                            style={[styles.timeChip, hour === h && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                        >
                            <Text style={[styles.timeChipText, { color: hour === h ? '#FFF' : Colors.textPrimary }]}>{h}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Minute Grid */}
                <Text style={[styles.wheelLabel, { color: Colors.textMuted, alignSelf: 'center', marginTop: 16, marginBottom: 8 }]}>MINUTE</Text>
                <View style={styles.chipGrid}>
                    {mins.map(m => (
                        <TouchableOpacity
                            key={m}
                            activeOpacity={0.7}
                            onPress={() => setMinute(m)}
                            style={[styles.timeChip, minute === m && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                        >
                            <Text style={[styles.timeChipText, { color: minute === m ? '#FFF' : Colors.textPrimary }]}>{m.toString().padStart(2, '0')}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* AM/PM */}
                <View style={[styles.ampmColumn, { flexDirection: 'row', justifyContent: 'center', marginTop: 16 }]}>
                    <TouchableOpacity
                        onPress={() => setAmpm('AM')}
                        style={[styles.ampmBtn, ampm === 'AM' && { backgroundColor: Colors.primary }]}>
                        <Text style={[styles.ampmText, { color: ampm === 'AM' ? '#FFF' : Colors.textPrimary }]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setAmpm('PM')}
                        style={[styles.ampmBtn, ampm === 'PM' && { backgroundColor: Colors.primary }]}>
                        <Text style={[styles.ampmText, { color: ampm === 'PM' ? '#FFF' : Colors.textPrimary }]}>PM</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <Modal transparent visible={visible} animationType="slide">
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: Colors.background, borderColor: Colors.border }]}>
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.title, { color: Colors.textPrimary }]}>Set Schedule</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={Colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        {!disableTime && (
                            <View style={[styles.tabContainer, { backgroundColor: Colors.backgroundElevated }]}>
                                <TouchableOpacity
                                    onPress={() => setMode('date')}
                                    style={[styles.tab, mode === 'date' && { backgroundColor: Colors.background }]}>
                                    <Text style={[styles.tabText, { color: mode === 'date' ? Colors.primary : Colors.textMuted }]}>Date</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setMode('time')}
                                    style={[styles.tab, mode === 'time' && { backgroundColor: Colors.background }]}>
                                    <Text style={[styles.tabText, { color: mode === 'time' ? Colors.primary : Colors.textMuted }]}>Time</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.content}>
                        {mode === 'date' ? renderCalendar() : renderTimePicker()}
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: Colors.primary }]} onPress={handleSave}>
                            <Text style={styles.confirmText}>
                                {isRange ? 'CONFIRM DATE RANGE' : 'CONFIRM TIMING'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    container: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, borderWidth: 1 },
    header: { padding: 24 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '900' },
    tabContainer: { flexDirection: 'row', borderRadius: 16, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    tabText: { fontWeight: '800', fontSize: 14 },
    content: { paddingHorizontal: 24 },
    // Calendar
    calendarContainer: {},
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    calendarMonth: { fontSize: 16, fontWeight: '800' },
    limitBadge: { backgroundColor: '#FFD16620', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    limitText: { color: '#B8860B', fontSize: 11, fontWeight: '800' },
    weekdaysRow: { flexDirection: 'row', marginBottom: 8 },
    weekdayText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayBox: { width: (width - 48) / 7, height: 44, justifyContent: 'center', alignItems: 'center' },
    dayText: { fontSize: 15, fontWeight: '700' },
    // Time
    timePickerContainer: { paddingVertical: 8 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
    timeChip: { width: 48, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
    timeChipText: { fontSize: 16, fontWeight: '800' },
    wheelLabel: { fontSize: 10, fontWeight: '800', marginBottom: 10 },
    ampmColumn: { gap: 10, marginLeft: 20, marginTop: 15 },
    ampmBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    ampmText: { fontSize: 14, fontWeight: '900' },
    // Footer
    footer: { paddingHorizontal: 24, marginTop: 20 },
    confirmBtn: { height: 48, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    confirmText: { color: '#000000', fontSize: 16, fontWeight: '900', letterSpacing: 1.2 },
});
