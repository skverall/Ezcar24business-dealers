import { getModelsForMake, getAllModels } from '@/data/models';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';

interface ModelsComboboxProps {
  value: string;
  onChange: (value: string) => void;
  selectedMake?: string;
  placeholder?: string;
  className?: string;
}

const ModelsCombobox = ({ 
  value, 
  onChange, 
  selectedMake, 
  placeholder = 'Select or type model', 
  className 
}: ModelsComboboxProps) => {
  // Get models based on selected make, or all models if no make selected
  const models = selectedMake ? getModelsForMake(selectedMake) : getAllModels();
  
  // Convert models to combobox options
  const options: ComboboxOption[] = models.map(model => ({
    value: model.value,
    label: model.label
  }));

  // Sort options alphabetically
  options.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search models..."
      emptyText={selectedMake ? "No model found for this make." : "No model found."}
      className={className}
      disabled={!selectedMake}
    />
  );
};

export default ModelsCombobox;
