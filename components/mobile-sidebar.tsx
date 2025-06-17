"use client";

import React from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"; // your shadcn ui path
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";

export const MobileSidebar = () => {
  return (
    <Sheet>
      {/* use asChild so the Menu icon itself receives the trigger props */}
      <SheetTrigger asChild>
        <button aria-label="Open navigation">
          <Menu className="text-white" size={24} />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="p-0 z-[100]">
        {/* include a SheetHeader + SheetTitle (visually hidden) for a11y */}
        <SheetHeader>
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        </SheetHeader>

        <Sidebar />
      </SheetContent>
    </Sheet>
  );
};
