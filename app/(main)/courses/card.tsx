import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";

type Props = {
  id: number;
  title: string;
  imageSrc: string;
  onClick: (id: number, title: string) => void;
  onAIClick?: () => void;
  disabled?: boolean;
  active?: boolean;
};

export const Card = ({
  id,
  title,
  imageSrc,
  onClick,
  onAIClick,
  disabled,
  active,
}: Props) => {
  
  return (
    <div
      className={cn(
        "h-full border-2 rounded-xl border-b-4 hover:bg-black/5 cursor-pointer active:border-b-2 flex flex-col items-center justify-between p-3 pb-6 min-h-[217px]",
        active && "border-green-400 bg-green-100"
      )}
    >
      <div className="min-[24px] w-full flex items-center justify-end">
        {active && (
          <div className="rounded-md bg-green-600 flex items-center justify-center p-1.5">
            <Check className="text-white stroke-[4] h-4 w-4" />
          </div>
        )}
      </div>

      <Image
        src={imageSrc}
        alt={title}
        height={70}
        width={93.33}
        className="rounded-lg drop-shadow-md border object-cover"
      />

      <div className="w-full space-y-2">
        <p className="text-neutral-700 text-center font-bold">{title}</p>

        <div className="flex flex-col space-y-2">
          <button
            className={cn(
              "w-full py-2 px-3 border-2 border-b-4 rounded-lg font-bold text-sm transition-all",
              active
                ? "border-green-500 bg-green-500 text-white hover:bg-green-600"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
              disabled && "pointer-events-none opacity-50"
            )}
            disabled={disabled}
            onClick={() => onClick(id, title)}
          >
            {active ? "Continue" : "Start"}
          </button>

          {onAIClick && (
            <button
              className="w-full py-2 px-3 border-2 border-b-4 rounded-lg font-bold text-sm transition-all border-blue-500 bg-blue-500 text-white hover:bg-blue-600"
              disabled={disabled}
              onClick={onAIClick}
            >
              🤖 AI Learning
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
