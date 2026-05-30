export type ValidationErrors = Record<string, string>;

export const isRequired = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return false;
  return value.toString().trim().length > 0;
};

export const isNumeric = (value: string) => {
  return /^\d*(\.\d+)?$/.test(value.trim());
};

export const normalizeNumeric = (value: string) => {
  return value.replace(/[^0-9.]/g, '');
};

export const validateForm = (values: Record<string, any>) => {
  const errors: ValidationErrors = {};
  if (!isRequired(values.appliance)) {
    errors.appliance = 'Appliance name is required.';
  }
  if (!isRequired(values.category)) {
    errors.category = 'Category is required.';
  }
  if (!isRequired(values.unit)) {
    errors.unit = 'Unit is required.';
  }
  if (!isRequired(values.period)) {
    errors.period = 'Usage period is required.';
  }
  if (!isRequired(values.value) || !isNumeric(values.value)) {
    errors.value = 'Enter a valid numeric usage value.';
  }
  if (values.period === 'Daily' && (!isRequired(values.hours) || !isNumeric(values.hours))) {
    errors.hours = 'Enter valid daily hours used.';
  }
  if (!isRequired(values.provider)) {
    errors.provider = 'Provider selection is required.';
  }
  if (!isRequired(values.rate) || !isNumeric(values.rate)) {
    errors.rate = 'Enter a valid rate in ₱/kWh.';
  }
  if (typeof values.quantity !== 'number' || values.quantity < 1) {
    errors.quantity = 'Quantity must be at least 1.';
  }
  return errors;
};
