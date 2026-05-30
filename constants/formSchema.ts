export const categories = ['Lighting', 'Cooling', 'Kitchen', 'Gadgets', 'Others'];
export const rooms = ['General', 'Living Room', 'Bedroom', 'Kitchen', 'Office'];
export const unitOptions = ['Watts', 'kWh'];
export const usagePeriods = ['Daily', 'Monthly'];

export type FormOption = {
  key: string;
  label: string;
  value?: string;
  // Iniwan natin ang type description dito para hindi masira ang ibang components mo na umaasa sa type na ito
  description?: string; 
};

export type FormFieldConfig = {
  key: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'numeric' | 'select' | 'stepper' | 'radio';
  required?: boolean;
  options?: FormOption[];
  min?: number;
  max?: number;
};

export const formFields: FormFieldConfig[] = [
  {
    key: 'appliance',
    label: 'Appliance Name',
    placeholder: 'e.g. LED Bulb',
    type: 'text',
    required: true,
  },
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    options: categories.map((category) => ({ key: category, label: category })),
  },
  {
    key: 'room',
    label: 'Room',
    type: 'select',
    options: rooms.map((room) => ({ key: room, label: room })),
  },
  {
    key: 'unit',
    label: 'Unit',
    type: 'radio',
    required: true,
    options: unitOptions.map((unit) => ({ key: unit, label: unit })),
  },
  {
    key: 'period',
    label: 'Usage Period',
    type: 'radio',
    required: true,
    options: usagePeriods.map((period) => ({ key: period, label: period })),
  },
  {
    key: 'value',
    label: 'Usage Value',
    placeholder: '0',
    type: 'numeric',
    required: true,
  },
  {
    key: 'hours',
    label: 'Hours per Day',
    placeholder: '0',
    type: 'numeric',
    required: true,
  },
  {
    key: 'quantity',
    label: 'Quantity',
    type: 'stepper',
    min: 1,
    max: 99,
  },
  {
    key: 'provider',
    label: 'Electricity Provider',
    type: 'select',
    // FIXED: Tinanggal ang description fields para malinis ang UI choices
    options: [
      { key: 'Meralco', label: 'Meralco' },
      { key: 'Aboitiz', label: 'Aboitiz' },
      { key: 'First Gen', label: 'First Gen' },
      { key: 'Custom', label: 'Custom' },
    ],
    required: true,
  },
  {
    key: 'rate',
    label: 'Rate per kWh',
    placeholder: '0.00',
    type: 'numeric',
    required: true,
  },
];