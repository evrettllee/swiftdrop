import { joinClassNames } from '@/shared/lib/class-names';
import { Spinner } from '@/shared/ui/spinner';

type BlockLoaderProps = {
  // What is loading, next to the spinner, for example «Считаем стоимость».
  text?: string;
  // The parent gives the size of the area and the look of the text.
  className?: string;
};

// The spinner in the middle of its area (design system §10 «Загрузка»): with a text, the two stand
// in one line 8px apart and are centered together.
export function BlockLoader({ text, className }: BlockLoaderProps) {
  return (
    <div className={joinClassNames('flex items-center justify-center gap-2', className ?? '')}>
      <Spinner />
      {text === undefined ? null : <span>{text}</span>}
    </div>
  );
}
