import React, { useMemo, useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
// 🛠️ FIX: Dalawang talon (`../../`) na para tumpak na tumuro sa root Services folder mo
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
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [formValues, setFormValues] = useState(defaultRecord);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState({ daily: 0, monthly: 0 });
  const [showResult, setShowResult] = useState(false);
  const [modalType, setModalType] = useState<'save' | 'exit' | null>(null);
  const [saving, setSaving] = useState(false);

  // ==========================================
  // 🔄 SECURITY ROUTE INTERCEPTOR GUARD
  // ==========================================
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/AuthScreen');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.centeredLoading}>
        <ActivityIndicator size="large" color="#1A442E" />
      </View>
    );
  }

  // Smart Automation controls for form field state switches
  const updateField = (key: string, value: any) => {
    setFormValues((prev) => {
      const updated = { ...prev, [key]: value };
      
      // 1. PERIOD CONDITIONAL LOGIC
      if (key === 'period') {
        if (value === 'Monthly') {
          updated.hours = '24'; // Auto-force to 24 hours
        } else if (value === 'Daily') {
          updated.hours = ''; // Reset back to empty to allow user typing
        }
      }

      // 2. PROVIDER AUTO-FILL RATE LOGIC
      if (key === 'provider') {
        if (value === 'Meralco') {
          updated.rate = '11.50';
        } else if (value === 'Aboitiz') {
          updated.rate = '10.80';
        } else if (value === 'First Gen') {
          updated.rate = '10.20';
        } else if (value === 'Custom') {
          updated.rate = ''; // Open field completely clean for custom tenant submeters
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
      const { success, dailyCost, monthlyCost } = await saveConsumptionRecord({
        ...formValues,
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
            <Text style={styles.fieldLabel}>{field.label}</Text>
            {errors[field.key] ? <Text style={styles.errorText}>{errors[field.key]}</Text> : null}
          </View>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => updateField('quantity', Math.max(field.min ?? 1, formValues.quantity - 1))}
              activeOpacity={0.75}
            >
              <Text style={styles.stepperSymbol}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{formValues.quantity}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => updateField('quantity', Math.min(field.max ?? 99, formValues.quantity + 1))}
              activeOpacity={0.75}
            >
              <Text style={styles.stepperSymbol}>+</Text>
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="FairWatt"
          subtitle="Track appliance energy use with smart validation and save confirmation."
          actionLabel="Exit"
          onAction={() => setModalType('exit')}
        />

        <View style={styles.card}>
          {fieldSections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.keys
                .map((key) => formFields.find((field) => field.key === key))
                .filter(Boolean)
                .map((field) => renderField(field as FormFieldConfig))}
            </View>
          ))}

          {showResult ? (
            <View style={styles.resultPreview}>
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Daily Share</Text>
                <Text style={styles.resultValue}>₱{result.daily.toFixed(2)}</Text>
              </View>
              <View style={[styles.resultBox, styles.monthlyBox]}>
                <Text style={styles.resultLabel}>Monthly Share</Text>
                <Text style={styles.resultValue}>₱{result.monthly.toFixed(2)}</Text>
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

      <ConfirmModal
        visible={modalType === 'exit'}
        title="Exit FairWatt"
        message="Are you sure you want to leave the tracker? Unsaved changes will be lost."
        onCancel={() => setModalType(null)}
        onConfirm={() => {
          Alert.alert('Goodbye', 'You can reopen the app at any time to continue tracking.');
          setModalType(null);
        }}
        confirmText="Exit"
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