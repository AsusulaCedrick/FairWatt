import React, { useMemo, useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { saveConsumptionRecord } from '../../Services/consumptionService';
import { FormField } from '../../components/FormField';
import { FormSelect } from '../../components/FormSelect';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { ErrorModal } from '../../components/ui/ErrorModal';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { Spacing } from '../../constants/Spacing';
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
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const [formValues, setFormValues] = useState(defaultRecord);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState({ daily: 0, monthly: 0 });
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/AuthScreen');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <View style={[styles.centeredLoading, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
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

  const handleSavePress = () => {
    const validationErrors = validateForm(formValues);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setErrorMessage('Please correct the highlighted fields before saving.');
      setShowErrorModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleSave = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    try {
      const { success, dailyCost, monthlyCost } = await saveConsumptionRecord({
        appliance: formValues.appliance,
        category: formValues.category,
        room: formValues.room, 
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
        setSuccessMessage(`Monthly estimated cost: ₱${safeMonthly.toFixed(2)}`);
        setShowSuccessModal(true);
        resetForm();
      }
    } catch (error) {
      setErrorMessage('Unable to save record. Check your network or credentials.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
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
            <Text style={[styles.fieldLabel, { color: themeColors.text }]}>{field.label}</Text>
            {errors[field.key] ? <Text style={[styles.errorText, { color: themeColors.error }]}>{errors[field.key]}</Text> : null}
          </View>
          <View style={[styles.stepperRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <TouchableOpacity
              style={[styles.stepperButton, { backgroundColor: isDarkMode ? '#334155' : '#FFFFFF', borderColor: themeColors.border }]}
              onPress={() => updateField('quantity', Math.max(field.min ?? 1, formValues.quantity - 1))}
              activeOpacity={0.75}
            >
              <Text style={[styles.stepperSymbol, { color: themeColors.text }]}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.stepperValue, { color: themeColors.text }]}>{formValues.quantity}</Text>
            <TouchableOpacity
              style={[styles.stepperButton, { backgroundColor: isDarkMode ? '#334155' : '#FFFFFF', borderColor: themeColors.border }]}
              onPress={() => updateField('quantity', Math.min(field.max ?? 99, formValues.quantity + 1))}
              activeOpacity={0.75}
            >
              <Text style={[styles.stepperSymbol, { color: themeColors.text }]}>+</Text>
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
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="FairWatt"
          subtitle="A Personal Electric Sub-Meter Tracker."
        />

        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {fieldSections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>{section.title}</Text>
              {section.keys
                .map((key) => formFields.find((field) => field.key === key))
                .filter(Boolean)
                .map((field) => renderField(field as FormFieldConfig))}
            </View>
          ))}

          {showResult ? (
            <View style={[styles.resultPreview, { backgroundColor: isDarkMode ? '#1E293B' : '#E8F5E9', borderColor: themeColors.primary }]}>
              <View style={styles.resultBox}>
                <Text style={[styles.resultLabel, { color: themeColors.textSecondary }]}>Daily Share</Text>
                <Text style={[styles.resultValue, { color: themeColors.text }]}>₱{result.daily.toFixed(2)}</Text>
              </View>
              <View style={[styles.resultBox, styles.monthlyBox, { borderColor: themeColors.border }]}>
                <Text style={[styles.resultLabel, { color: themeColors.textSecondary }]}>Monthly Share</Text>
                <Text style={[styles.resultValue, { color: themeColors.text }]}>₱{result.monthly.toFixed(2)}</Text>
              </View>
            </View>
          ) : null}

          <Button
            title={saving ? 'Saving…' : 'Calculate & Save'}
            onPress={handleSavePress}
            disabled={saving}
          />
        </View>
      </ScrollView>

      {/* --- CONFIRMATION MODAL --- */}
      <ConfirmationModal
        visible={showConfirmModal}
        title="Save application usage?"
        message="Do you want to save this application usage record?"
        confirmText="Save"
        iconName="save"
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleSave}
      />

      {/* --- SUCCESS MODAL --- */}
      <SuccessModal
        visible={showSuccessModal}
        title="Success!"
        message={successMessage}
        onConfirm={() => setShowSuccessModal(false)}
      />

      {/* --- ERROR MODAL --- */}
      <ErrorModal
        visible={showErrorModal}
        title="Validation Error"
        message={errorMessage}
        onConfirm={() => setShowErrorModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1.5,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...Fonts.h3,
    fontWeight: '700',
    marginBottom: 14,
  },
  resultPreview: {
    marginTop: 10,
    marginBottom: 24,
    borderRadius: Radius.input,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1.5,
  },
  resultBox: {
    flex: 1,
    padding: 18,
  },
  monthlyBox: {
    borderLeftWidth: 1.5,
  },
  centeredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultLabel: {
    ...Fonts.caption,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultValue: {
    ...Fonts.h1,
    fontWeight: '700',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    ...Fonts.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderWidth: 1.5,
    borderRadius: Radius.input,
    padding: 10,
    height: 60,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.button - 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  stepperSymbol: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepperValue: {
    ...Fonts.h3,
    fontWeight: '700',
  },
  errorText: {
    ...Fonts.caption,
  },
});