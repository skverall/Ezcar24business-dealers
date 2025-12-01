import { getTrimsForModelByMake } from '@/data/models';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';

interface TrimsComboboxProps {
  value: string;
  onChange: (value: string) => void;
  selectedMake?: string;
  selectedModel?: string;
  placeholder?: string;
  className?: string;
}

const TrimsCombobox = ({
  value,
  onChange,
  selectedMake,
  selectedModel,
  placeholder = 'Select or type trim',
  className
}: TrimsComboboxProps) => {
  // Get trims based on selected make and model
  const trims = (selectedMake && selectedModel)
    ? getTrimsForModelByMake(selectedMake, selectedModel)
    : [];

  // Convert trims to combobox options
  const options: ComboboxOption[] = trims.map(trim => ({
    value: trim.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    label: trim
  }));

  // Sort options alphabetically
  options.sort((a, b) => a.label.localeCompare(b.label));

  const isDisabled = !selectedMake || !selectedModel;

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search trims..."
      emptyText={
        !selectedMake
          ? "Please select a make first."
          : !selectedModel
            ? "Please select a model first."
            : "No trims found for this model."
      }
      className={className}
      disabled={isDisabled}
    />
  );
};

export default TrimsCombobox;
