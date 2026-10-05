type ResponsiveTextProps = {
  full: string;
  short: string;
};

// The design has a shorter text for a phone: only one of the two is shown (and read aloud).
export function ResponsiveText({ full, short }: ResponsiveTextProps) {
  return (
    <>
      <span className="lg:hidden">{short}</span>
      <span className="hidden lg:inline">{full}</span>
    </>
  );
}
