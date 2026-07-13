"use client";

import * as React from "react";
import { useRef } from "react";
import {
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import clsx from "clsx";
import { twMerge } from "tailwind-merge";

import Link from "next/link";

const cn = (...args: any[]) => twMerge(clsx(args));

export interface AnimatedDockProps {
  className?: string;
  items: DockItemData[];
}

export interface DockItemData {
  link?: string;
  onClick?: () => void;
  Icon: React.ReactNode;
  target?: string;
}

export const AnimatedDock = ({ className, items }: AnimatedDockProps) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto flex h-10 items-end gap-2 rounded-2xl bg-secondary/50 border border-primary/10 shadow-md px-2 pb-1",
        className
      )}
    >
      {items.map((item, index) => (
        <DockItem key={index} mouseX={mouseX}>
          {item.link ? (
            <Link
              href={item.link}
              target={item.target}
              className="grow flex items-center justify-center w-full h-full text-primary-foreground"
            >
              {item.Icon}
            </Link>
          ) : item.onClick ? (
            <button
              onClick={item.onClick}
              className="grow flex items-center justify-center w-full h-full text-primary-foreground"
            >
              {item.Icon}
            </button>
          ) : (
            <div className="grow flex items-center justify-center w-full h-full text-primary-foreground">
              {item.Icon}
            </div>
          )}
        </DockItem>
      ))}
    </motion.div>
  );
};

interface DockItemProps {
  mouseX: MotionValue<number>;
  children: React.ReactNode;
}

export const DockItem = ({ mouseX, children }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-100, 0, 100], [32, 42, 32]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const iconScale = useTransform(width, [32, 42], [1, 1.1]);
  const iconSpring = useSpring(iconScale, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className="aspect-square w-8 rounded-full bg-primary text-secondary-foreground flex items-center justify-center"
    >
      <motion.div
        style={{ scale: iconSpring }}
        className="flex items-center justify-center w-full h-full grow"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
