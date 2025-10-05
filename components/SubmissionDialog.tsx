"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircleCheck, CircleX } from "lucide-react";

interface SubmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: "success" | "error";
}

export function SubmissionDialog({
  isOpen,
  onClose,
  title,
  message,
  type,
}: SubmissionDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="flex flex-col items-center text-center">
        <AlertDialogHeader>
          {type === "success" ? (
            <CircleCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : (
            <CircleX className="h-16 w-16 text-red-500 mx-auto mb-4" />
          )}
          <AlertDialogTitle className="text-2xl font-bold text-center">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-center text-gray-600 dark:text-gray-300">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogAction onClick={onClose} className="mt-6 w-full max-w-xs">
          ОК
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}
