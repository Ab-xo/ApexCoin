"use client";

import Image from "next/image";
import { CircleDollarSign } from "lucide-react";
import { useState } from "react";

type CoinIconProps = {
  image: string | null;
  name: string;
  size?: "small" | "large";
};

const sizes = {
  small: "h-9 w-9",
  large: "h-10 w-10",
};

export function CoinIcon({ image, name, size = "small" }: CoinIconProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageUrl =
    image?.startsWith("https://") && failedImage !== image ? image : null;

  return (
    <span
      role="img"
      aria-label={`${name} logo`}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-950/70 ${sizes[size]}`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="h-full w-full object-contain"
          onError={() => setFailedImage(imageUrl)}
        />
      ) : (
        <CircleDollarSign aria-hidden="true" className="h-5 w-5 text-slate-400" />
      )}
    </span>
  );
}
