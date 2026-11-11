import { Input, type InputProps } from '@/shared/ui/input';

type DateFieldProps = Omit<InputProps, 'type' | 'value' | 'onChange' | 'className'> & {
  value: string | null;
  onChange: (value: string | null) => void;
};

export function DateField({ value, onChange, ...rest }: DateFieldProps) {
  return (
    <Input
      type="date"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
      {...rest}
    />
  );
}
