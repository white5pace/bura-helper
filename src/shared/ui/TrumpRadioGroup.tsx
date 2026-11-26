import { clubs, diamonds, hearts, spades } from "@/assets/icons";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type TrumpSuit } from "@/lib/gameRules";

const SUIT_OPTIONS: { value: TrumpSuit; src: string; alt: string }[] = [
  { value: "крести", src: clubs, alt: "крести" },
  { value: "пики", src: spades, alt: "пики" },
  { value: "черви", src: hearts, alt: "черви" },
  { value: "буби", src: diamonds, alt: "буби" },
];

function TrumpRadioGroup({
  name,
  value,
  onValueChange,
  invalid = false,
}: {
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <RadioGroup
      name={name}
      value={value}
      onValueChange={(nextValue) => {
        onValueChange(nextValue);
      }}
      className="flex w-auto flex-row items-center gap-4"
    >
      {SUIT_OPTIONS.map((suit) => (
        <Label key={suit.value}>
          <RadioGroupItem value={suit.value} aria-invalid={invalid} />
          <img src={suit.src} alt={suit.alt} className="shrink-0" />
        </Label>
      ))}
    </RadioGroup>
  );
}

export default TrumpRadioGroup;
