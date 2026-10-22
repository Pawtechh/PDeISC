import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import * as Haptics from 'expo-haptics';
import { Text, Card, Row, Stack, Button, Divider } from '../ui';
import { colors, radii, spacing, useTheme } from '../../theme';
import { calcularEdad } from '../../schemas/auth.schema';

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const MESES_CAPITALIZED = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export const formatearFechaVisual = (isoDate?: string): string => {
  if (!isoDate || !isoDate.trim()) return '';
  const parts = isoDate.trim().split('-');
  if (parts.length !== 3) return isoDate;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(monthIdx) || isNaN(day)) return isoDate;
  return `${day} de ${MESES[monthIdx] || ''} de ${year}`;
};

export interface DatePickerInputProps {
  label?: string;
  value?: string;
  onChange?: (date: string) => void;
  error?: string;
  helperText?: string;
  testID?: string;
  placeholder?: string;
  isBirthDate?: boolean;
}

export const DatePickerInputView: React.FC<DatePickerInputProps> = ({
  label = 'Fecha de Nacimiento',
  value,
  onChange,
  error,
  helperText,
  testID = 'datepicker-input',
  placeholder = 'Seleccionar fecha',
  isBirthDate = true,
}) => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const hoy = useMemo(() => new Date(), []);
  const maxYear = isBirthDate ? hoy.getFullYear() : hoy.getFullYear() + 1;
  const minYear = isBirthDate ? hoy.getFullYear() - 120 : hoy.getFullYear();

  const maxDateFuture = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d;
  }, []);

  // Fecha seleccionada actual
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    if (isBirthDate) {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 20);
      return d;
    }
    return new Date();
  }, [value, isBirthDate]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());
  const [tempSelected, setTempSelected] = useState<string>(value || '');

  const openModal = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
      setTempSelected(value);
    } else {
      if (isBirthDate) {
        const defaultY = hoy.getFullYear() - 20;
        setViewYear(defaultY);
        setViewMonth(0);
        setTempSelected(`${defaultY}-01-15`);
      } else {
        setViewYear(hoy.getFullYear());
        setViewMonth(hoy.getMonth());
        setTempSelected(hoy.toISOString().split('T')[0]);
      }
    }
    setShowYearPicker(false);
    setModalVisible(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      if (viewYear > minYear) {
        setViewYear(viewYear - 1);
        setViewMonth(11);
      }
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      if (viewYear < maxYear) {
        setViewYear(viewYear + 1);
        setViewMonth(0);
      }
    } else {
      const candidateDate = new Date(viewYear, viewMonth + 1, 1);
      if (candidateDate <= hoy) {
        setViewMonth(viewMonth + 1);
      }
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const iso = `${viewYear}-${mStr}-${dStr}`;
    setTempSelected(iso);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleConfirm = () => {
    if (tempSelected && onChange) {
      onChange(tempSelected);
    }
    setModalVisible(false);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const handleCancel = () => {
    setModalVisible(false);
    setTempSelected(value || '');
  };

  // Calcular días en el mes actual
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // 0 es Domingo, 1 es Lunes en JS
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    // Ajustar para empezar en Lunes (0=Lunes, 6=Domingo)
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days: (number | null)[] = [];
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [viewYear, viewMonth]);

  // Lista de años disponibles para salto rápido
  const yearsList = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [maxYear, minYear]);

  // Edad para el valor actual confirmado
  const edadActual = useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split('-').map(Number);
    return calcularEdad(new Date(y, m - 1, d));
  }, [value]);

  // Edad para la selección temporal en el modal
  const edadTemp = useMemo(() => {
    if (!tempSelected || !/^\d{4}-\d{2}-\d{2}$/.test(tempSelected)) return null;
    const [y, m, d] = tempSelected.split('-').map(Number);
    return calcularEdad(new Date(y, m - 1, d));
  }, [tempSelected]);

  const formattedDisplay = formatearFechaVisual(value);

  return (
    <Stack spacing="xs" style={styles.container}>
      {label && (
        <Text variant="caption" color={theme.subtext} style={styles.label}>
          {label}
        </Text>
      )}

      {/* Botón / Input de Apertura */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openModal}
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.inputBg,
            borderColor: error ? colors.semantic.danger : theme.inputBorder,
          },
        ]}
        testID={testID}
      >
        <Row justify="space-between" align="center" style={{ width: '100%' }}>
          <Text
            variant="body"
            color={formattedDisplay ? theme.text : theme.subtext}
            style={formattedDisplay ? styles.inputText : undefined}
          >
            {formattedDisplay || placeholder}
          </Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </Row>
      </TouchableOpacity>

      {/* Helper text / Error / Edad */}
      {error ? (
        <Text variant="caption" color={colors.semantic.danger} testID={`${testID}-error`}>
          {error}
        </Text>
      ) : isBirthDate && edadActual !== null ? (
        <Row spacing="xs" align="center">
          {edadActual >= 18 ? (
            <Text variant="caption" color={colors.semantic.success} testID={`${testID}-edad`}>
              ✓ Edad calculada: {edadActual} años
            </Text>
          ) : (
            <Text variant="caption" color={colors.semantic.danger} testID={`${testID}-edad`}>
              ⚠️ Tenés {edadActual} años. Debés ser mayor de 18 años para registrarte.
            </Text>
          )}
        </Row>
      ) : helperText ? (
        <Text variant="caption" color={theme.subtext}>
          {helperText}
        </Text>
      ) : null}

      {/* Modal Interactivo con Calendario */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
        testID={`${testID}-modal`}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="md"
            style={[
              styles.calendarCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
          >
            <Stack spacing="sm">
              <Row justify="space-between" align="center">
                <Text variant="h3" color={theme.text}>
                  {isBirthDate ? 'Fecha de Nacimiento' : 'Seleccionar Fecha'}
                </Text>
                <TouchableOpacity onPress={handleCancel}>
                  <Text variant="body" color={theme.subtext} style={{ padding: 4 }}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </Row>

              <Divider />

              {/* Selector de Mes y Año con navegación rápida */}
              <Row justify="space-between" align="center" style={styles.headerNavigation}>
                <Row spacing="xs" align="center">
                  <TouchableOpacity
                    onPress={() => setViewYear((y) => Math.max(minYear, y - 1))}
                    style={[styles.navButtonSmall, { backgroundColor: theme.isDark ? '#334155' : colors.sand[50] }]}
                    testID="datepicker-prev-year"
                  >
                    <Text variant="caption" color={theme.isDark ? '#38BDF8' : colors.ocean[700]} style={styles.bold}>
                      « -1a
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handlePrevMonth}
                    style={[styles.navButton, { backgroundColor: theme.isDark ? '#334155' : colors.sand[100] }]}
                    testID="datepicker-prev-month"
                  >
                    <Text variant="body" color={theme.isDark ? '#38BDF8' : colors.ocean[700]} style={styles.bold}>
                      ‹
                    </Text>
                  </TouchableOpacity>
                </Row>

                <TouchableOpacity
                  onPress={() => setShowYearPicker(!showYearPicker)}
                  style={styles.monthYearTitle}
                  testID="datepicker-month-year-toggle"
                >
                  <Text variant="button" color={theme.text}>
                    {MESES_CAPITALIZED[viewMonth]} {viewYear} ▾
                  </Text>
                </TouchableOpacity>

                <Row spacing="xs" align="center">
                  <TouchableOpacity
                    onPress={handleNextMonth}
                    style={[styles.navButton, { backgroundColor: theme.isDark ? '#334155' : colors.sand[100] }]}
                    testID="datepicker-next-month"
                  >
                    <Text variant="body" color={theme.isDark ? '#38BDF8' : colors.ocean[700]} style={styles.bold}>
                      ›
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const nextY = viewYear + 1;
                      if (nextY <= maxYear) setViewYear(nextY);
                    }}
                    style={[styles.navButtonSmall, { backgroundColor: theme.isDark ? '#334155' : colors.sand[50] }]}
                    testID="datepicker-next-year"
                  >
                    <Text variant="caption" color={theme.isDark ? '#38BDF8' : colors.ocean[700]} style={styles.bold}>
                      +1a »
                    </Text>
                  </TouchableOpacity>
                </Row>
              </Row>

              {/* Selector desplegable de año si está activado */}
              {showYearPicker ? (
                <View style={[styles.yearPickerBox, { backgroundColor: theme.isDark ? '#0F172A' : colors.sand[50] }]}>
                  <Text variant="caption" color={theme.subtext} style={{ marginBottom: 4 }}>
                    {isBirthDate ? 'Seleccioná tu año de nacimiento:' : 'Seleccioná el año:'}
                  </Text>
                  <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                    <View style={styles.yearGrid}>
                      {yearsList.map((y) => (
                        <TouchableOpacity
                          key={y}
                          onPress={() => {
                            setViewYear(y);
                            setShowYearPicker(false);
                          }}
                          style={[
                            styles.yearItem,
                            {
                              backgroundColor: y === viewYear ? (theme.isDark ? '#0284C7' : colors.ocean[500]) : (theme.isDark ? '#1E293B' : colors.white),
                              borderColor: y === viewYear ? (theme.isDark ? '#38BDF8' : colors.ocean[600]) : (theme.isDark ? '#334155' : colors.sand[200]),
                            },
                          ]}
                          testID={`datepicker-year-${y}`}
                        >
                          <Text
                            variant="caption"
                            color={y === viewYear ? '#FFFFFF' : theme.text}
                            style={y === viewYear ? styles.bold : undefined}
                          >
                            {y}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              ) : (
                /* Grilla del Calendario */
                <View style={styles.calendarBody}>
                  {/* Días de la semana */}
                  <Row justify="space-around" style={styles.weekRow}>
                    {DIAS_SEMANA.map((dia) => (
                      <Text
                        key={dia}
                        variant="caption"
                        color={theme.isDark ? '#94A3B8' : colors.sand[500]}
                        style={styles.weekDayText}
                      >
                        {dia}
                      </Text>
                    ))}
                  </Row>

                  {/* Días del mes */}
                  <View style={styles.daysGrid}>
                    {calendarDays.map((d, index) => {
                      if (d === null) {
                        return <View key={`empty-${index}`} style={styles.dayCell} />;
                      }

                      const mStr = String(viewMonth + 1).padStart(2, '0');
                      const dStr = String(d).padStart(2, '0');
                      const currentIso = `${viewYear}-${mStr}-${dStr}`;
                      const isSelected = tempSelected === currentIso;

                      const currentDate = new Date(viewYear, viewMonth, d);
                      let isDisabled = false;
                      if (isBirthDate) {
                        isDisabled = currentDate > hoy || viewYear < minYear;
                      } else {
                        const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
                        isDisabled = currentDate < hoySinHora || currentDate > maxDateFuture;
                      }

                      return (
                        <TouchableOpacity
                          key={`day-${d}`}
                          disabled={isDisabled}
                          onPress={() => handleSelectDay(d)}
                          style={[
                            styles.dayCell,
                            isSelected && {
                              backgroundColor: theme.isDark ? '#0284C7' : colors.ocean[500],
                              borderWidth: 1,
                              borderColor: theme.isDark ? '#38BDF8' : colors.ocean[600],
                            },
                            isDisabled && styles.dayCellDisabled,
                          ]}
                          testID={`datepicker-day-${d}`}
                        >
                          <Text
                            variant="caption"
                            color={
                              isSelected
                                ? '#FFFFFF'
                                : isDisabled
                                ? (theme.isDark ? '#475569' : colors.sand[300])
                                : theme.text
                            }
                            style={isSelected ? styles.bold : undefined}
                          >
                            {d}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Resumen de selección actual y edad */}
              <Card padding="sm" style={[styles.summaryBox, { backgroundColor: theme.isDark ? '#0F172A' : colors.sand[50], borderColor: theme.border, borderWidth: 1 }]}>
                <Row justify="space-between" align="center">
                  <Text variant="caption" color={theme.subtext}>
                    Seleccionado:
                  </Text>
                  <Text variant="caption" color={theme.isDark ? '#38BDF8' : colors.ocean[900]} style={styles.bold}>
                    {tempSelected ? formatearFechaVisual(tempSelected) : 'Ninguno'}
                  </Text>
                </Row>
                {isBirthDate && edadTemp !== null && (
                  <Row justify="space-between" align="center" style={{ marginTop: 2 }}>
                    <Text variant="caption" color={theme.subtext}>
                      Edad calculada:
                    </Text>
                    <Text
                      variant="caption"
                      color={edadTemp >= 18 ? colors.semantic.success : colors.semantic.danger}
                      style={styles.bold}
                    >
                      {edadTemp >= 18
                        ? `${edadTemp} años (Mayor de edad)`
                        : `${edadTemp} años (Menor de 18)`}
                    </Text>
                  </Row>
                )}
              </Card>

              {/* Botones de Acción */}
              <Row justify="flex-end" spacing="sm" style={{ marginTop: 4 }}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  size="sm"
                  onPress={handleCancel}
                  testID="datepicker-btn-cancelar"
                />
                <Button
                  title="Confirmar"
                  variant="primary"
                  size="sm"
                  disabled={!tempSelected}
                  onPress={handleConfirm}
                  testID="datepicker-btn-confirmar"
                />
              </Row>
            </Stack>
          </Card>
        </View>
      </Modal>
    </Stack>
  );
};

// Componente Wrapper compatible con react-hook-form Controller
export interface FormDatePickerInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  helperText?: string;
  placeholder?: string;
  testID?: string;
}

export function FormDatePickerInput<T extends FieldValues>({
  control,
  name,
  label,
  helperText,
  placeholder,
  testID,
}: FormDatePickerInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <DatePickerInputView
          label={label}
          value={value}
          onChange={onChange}
          error={error?.message}
          helperText={helperText}
          placeholder={placeholder}
          testID={testID}
        />
      )}
    />
  );
}

export const DatePickerInput = DatePickerInputView;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 46,
    justifyContent: 'center',
  },
  inputNormal: {
    borderColor: colors.sand[300],
  },
  inputError: {
    borderColor: colors.semantic.danger,
  },
  inputText: {
    fontWeight: '600',
  },
  calendarIcon: {
    fontSize: 16,
  },
  bold: {
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
  },
  headerNavigation: {
    paddingVertical: spacing.xs,
  },
  navButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.sand[100],
  },
  navButtonSmall: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.sand[50],
  },
  monthYearTitle: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  yearPickerBox: {
    backgroundColor: colors.sand[50],
    padding: spacing.sm,
    borderRadius: radii.md,
    maxHeight: 220,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  yearItem: {
    width: 60,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.sand[200],
    alignItems: 'center',
  },
  yearItemSelected: {
    backgroundColor: colors.ocean[500],
    borderColor: colors.ocean[600],
  },
  calendarBody: {
    marginTop: spacing.xs,
  },
  weekRow: {
    marginBottom: spacing.xs,
  },
  weekDayText: {
    width: 36,
    textAlign: 'center',
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: colors.ocean[500],
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  summaryBox: {
    backgroundColor: colors.sand[50],
    borderRadius: radii.md,
    marginTop: spacing.xs,
  },
});
