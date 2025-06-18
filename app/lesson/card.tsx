
import { challenges } from "@/db/schema";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCallback } from "react";
import { useAudio, useKey } from "react-use";

type Props = {
  id: number;
  imageSrc: string | null;
  audioSrc: string | null;
  text: string;
  shortcut: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
  status?: "correct" | "wrong" | "none";
  type: (typeof challenges.$inferSelect)["type"];
};

const ChoiceCard: React.FC<Props> = ({
  imageSrc,
  audioSrc,
  text,
  shortcut,
  selected,
  onClick,
  disabled,
  status,
  type,
}) => {
  // Only pass audioSrc if non-empty
  const [audio, , controls] = useAudio({ src: audioSrc as string });

  const handleClick = useCallback(() => {
    if (disabled) return;
    if (audioSrc) controls.play();
    onClick();
  }, [disabled, onClick, controls, audioSrc]);

  // Keyboard shortcut
  useKey(shortcut, handleClick, {}, [handleClick]);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative h-full border-2 rounded-xl border-b-4 p-4 lg:p-6 cursor-pointer active:border-b-2 transition",
        disabled && "pointer-events-none opacity-60",
        selected && "border-sky-400 bg-sky-50",
        selected && status === "correct" && "border-green-400 bg-green-50",
        selected && status === "wrong" && "border-rose-400 bg-rose-50",
        type === "ASSIST" && "flex items-center justify-between lg:p-3 w-full"
      )}
    >
      {audio}

      {/* Image (if available) */}
      {imageSrc && (
        <div className="relative aspect-square mb-4 h-[80px] lg:h-[150px] w-full overflow-hidden rounded-lg">
          <Image
            src={imageSrc}
            alt={text}
            fill
            sizes="(max-width: 768px) 100vw, 150px"
            className="object-cover"
          />
        </div>
      )}

      {/* Text and Shortcut */}
      <div
        className={cn(
          "flex items-center justify-between",
          type === "ASSIST" && "flex-row-reverse"
        )}
      >
        {type === "ASSIST" && <div className="w-6" />}

        <p
          className={cn(
            "text-neutral-700 text-sm lg:text-base",
            selected && "font-semibold",
            selected && status === "correct" && "text-green-600",
            selected && status === "wrong" && "text-rose-600"
          )}
        >
          {text}
        </p>

        <div
          className={cn(
            "flex-shrink-0 flex items-center justify-center w-[30px] h-[30px] rounded-lg border-2 text-xs font-semibold transition",
            selected && "border-sky-400 text-sky-400",
            selected &&
              status === "correct" &&
              "border-green-400 text-green-400",
            selected && status === "wrong" && "border-rose-400 text-rose-400",
            !selected &&
              "border-gray-300 text-gray-500 group-hover:border-gray-400"
          )}
        >
          {shortcut}
        </div>
      </div>
    </div>
  );
};

export default ChoiceCard;
