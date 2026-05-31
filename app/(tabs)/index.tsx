import React, { useMemo, useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { saveConsumptionRecord } from '../../Services/consumptionService';
import { FormField } from '../../components/FormField';
import { FormSelect } from '../../components/FormSelect';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ScreenHeader } from '../../components/ScreenHeader';
import {
  formFields,
  FormFieldConfig,
} from '../../constants/formSchema';
import { normalizeNumeric, validateForm } from '../../utils/validation';

const defaultRecord = {
  appliance: '',
  category: 'Others',
  room: 'General',
  unit: 'Watts',
  period: 'Daily',
  value: '',
  hours: '',
  quantity: 1,
  provider: 'Meralco',
  rate: '11.50',
};

export default function HomeScreen() {
  const { user, isLoading, isDarkMode } = useAuth();
  const router = useRouter();
  const [formValues, setFormValues] = useState(defaultRecord);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState({ daily: 0, monthly: 0 });
  const [showResult, setShowResult] = useState(false);
  const [modalType, setModalType] = useState<'save' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/AuthScreen');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <View style={[styles.centeredLoading, { backgroundColor: isDarkMode ? '#121212' : '#F5F7FA' }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#FFFFFF' : '#1A442E'} />
      </View>
    );
  }

  const updateField = (key: string, value: any) => {
    setFormValues((prev) => {
      const updated = { ...prev, [key]: value };
      
      if (key === 'period') {
        if (value === 'Monthly') {
          updated.hours = '24';
        } else if (value === 'Daily') {
          updated.hours = '';
        }
      }

      if (key === 'provider') {
        if (value === 'Meralco') {
          updated.rate = '11.50';
        } else if (value === 'Aboitiz') {
          updated.rate = '10.80';
        } else if (value === 'First Gen') {
          updated.rate = '10.20';
        } else if (value === 'Custom') {
          updated.rate = '';
        }
      }
      
      return updated;
    });
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setShowResult(false);
  };

  const resetForm = () => {
    setFormValues(defaultRecord);
    setErrors({});
    setShowResult(false);
  };

  const handleSave = async () => {
    const validationErrors = validateForm(formValues);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      Alert.alert('Validation Error', 'Please correct the highlighted fields before saving.');
      return;
    }

    setSaving(true);
    try {
      // ✅ MATYAGANG INAYOS: Explicitly na nating ipinapasa ang room property kasama ang form fields
      const { success, dailyCost, monthlyCost } = await saveConsumptionRecord({
        appliance: formValues.appliance,
        category: formValues.category,
        room: formValues.room, // 👈 Narito na, ligtas at 100% dynamic na ipapasa sa consumptionService mo!
        unit: formValues.unit,
        period: formValues.period,
        value: formValues.value,
        hours: formValues.hours,
        quantity: formValues.quantity,
        provider: formValues.provider,
        rate: formValues.rate,
      });

      if (success) {
        const safeDaily = dailyCost || 0;
        const safeMonthly = monthlyCost || 0;

        setResult({ daily: safeDaily, monthly: safeMonthly });
        setShowResult(true);
        Alert.alert('Saved', `Monthly estimated cost: ₱${safeMonthly.toFixed(2)}`);
        resetForm();
      }
    } catch (error) {
      Alert.alert('Save Failed', 'Unable to save record. Check your network or credentials.');
    } finally {
      setSaving(false);
      setModalType(null);
    }
  };

  const fieldSections = useMemo(
    () => [
      {
        title: 'Appliance details',
        keys: ['appliance', 'category', 'room'],
      },
      {
        title: 'Usage details',
        keys: ['unit', 'period', 'value', 'hours', 'quantity'],
      },
      {
        title: 'Provider',
        keys: ['provider', 'rate'],
      },
    ],
    []
  );

  const renderField = (field: FormFieldConfig) => {
    if (field.type === 'select' || field.type === 'radio') {
      return (
        <FormSelect
          key={field.key}
          label={field.label}
          options={field.options ?? []}
          selectedKey={(formValues as any)[field.key]}
          onSelect={(value) => updateField(field.key, value)}
          error={errors[field.key]}
        />
      );
    }

    if (field.type === 'stepper') {
      return (
        <View key={field.key} style={styles.fieldContainer}>
          <View style={styles.stepperHeader}>
            <Text style={[styles.fieldLabel, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>{field.label}</Text>
            {errors[field.key] ? <Text style={styles.errorText}>{errors[field.key]}</Text> : null}
          </View>
          <View style={[styles.stepperRow, { backgroundColor: isDarkMode ? '#2D3748' : '#F8FAFC', borderColor: isDarkMode ? '#4A5568' : '#CBD5E1' }]}>
            <TouchableOpacity
              style={[styles.stepperButton, { backgroundColor: isDarkMode ? '#4A5568' : '#FFFFFF', borderColor: isDarkMode ? '#718096' : '#E2E8F0' }]}
              onPress={() => updateField('quantity', Math.max(field.min ?? 1, formValues.quantity - 1))}
              activeOpacity={0.75}
            >
              <Text style={[styles.stepperSymbol, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.stepperValue, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>{formValues.quantity}</Text>
            <TouchableOpacity
              style={[styles.stepperButton, { backgroundColor: isDarkMode ? '#4A5568' : '#FFFFFF', borderColor: isDarkMode ? '#718096' : '#E2E8F0' }]}
              onPress={() => updateField('quantity', Math.min(field.max ?? 99, formValues.quantity + 1))}
              activeOpacity={0.75}
            >
              <Text style={[styles.stepperSymbol, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <FormField
        key={field.key}
        label={field.label}
        placeholder={field.placeholder}
        value={(formValues as any)[field.key].toString()}
        onChangeText={(text) =>
          updateField(field.key, field.type === 'numeric' ? normalizeNumeric(text) : text)
        }
        keyboardType={field.type === 'numeric' ? 'numeric' : 'default'}
        error={errors[field.key]}
        editable={
          field.key === 'hours'
            ? formValues.period !== 'Monthly'
            : field.key === 'rate'
            ? formValues.provider === 'Custom'
            : true
        }
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F7FA' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="FairWatt"
          subtitle="A Personal Electric Sub-Meter Tracker."
        />

        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          {fieldSections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>{section.title}</Text>
              {section.keys
                .map((key) => formFields.find((field) => field.key === key))
                .filter(Boolean)
                .map((field) => renderField(field as FormFieldConfig))}
            </View>
          ))}

          {showResult ? (
            <View style={[styles.resultPreview, { backgroundColor: isDarkMode ? '#1E3A8A' : '#E0F2FE' }]}>
              <View style={styles.resultBox}>
                <Text style={[styles.resultLabel, { color: isDarkMode ? '#93C5FD' : '#334155' }]}>Daily Share</Text>
                <Text style={[styles.resultValue, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>₱{result.daily.toFixed(2)}</Text>
              </View>
              <View style={[styles.resultBox, styles.monthlyBox, { borderColor: isDarkMode ? '#3B82F6' : '#B6E0FE' }]}>
                <Text style={[styles.resultLabel, { color: isDarkMode ? '#93C5FD' : '#334155' }]}>Monthly Share</Text>
                <Text style={[styles.resultValue, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>₱{result.monthly.toFixed(2)}</Text>
              </View>
            </View>
          ) : null}

          <PrimaryButton
            title={saving ? 'Saving…' : 'Calculate & Save'}
            onPress={() => setModalType('save')}
            disabled={saving}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={modalType === 'save'}
        title="Save Consumption Record"
        message="Do you want to save this appliance usage record?"
        onCancel={() => setModalType(null)}
        onConfirm={handleSave}
        confirmText="Save"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: 14,
  },
  resultPreview: {
    marginTop: 10,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#E0F2FE',
  },
  resultBox: {
    flex: 1,
    padding: 18,
  },
  monthlyBox: {
    borderLeftWidth: 1,
    borderColor: '#B6E0FE',
  },
  centeredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stepperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 10,
  },
  stepperButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperSymbol: {
    fontSize: 20,
    color: '#0F172A',
    fontWeight: '700',
  },
  stepperValue: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
  },
});