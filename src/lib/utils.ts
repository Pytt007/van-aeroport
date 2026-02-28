import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isTimeValid(date: Date | undefined, timeStr: string): { isValid: boolean; error?: string } {
  if (!date) return { isValid: false, error: "Veuillez sélectionner une date." };

  const [hours, minutes] = timeStr.split(":").map(Number);
  const selectedDateTime = new Date(date);
  selectedDateTime.setHours(hours, minutes, 0, 0);

  // Buffer of 5 minutes to avoid errors due to form filling time
  const now = new Date();
  now.setMinutes(now.getMinutes() - 5);
  now.setSeconds(0, 0);

  if (selectedDateTime < now) {
    return {
      isValid: false,
      error: "Vous ne pouvez pas effectuer une réservation à une date ou heure passée."
    };
  }

  return { isValid: true };
}

export function getMinBookingDateTime(): { date: Date; time: string } {
  const minAllowedTime = new Date();
  // Add 15 minutes buffer for the default suggested time
  minAllowedTime.setMinutes(minAllowedTime.getMinutes() + 15);

  const hours = minAllowedTime.getHours().toString().padStart(2, '0');
  const minutes = minAllowedTime.getMinutes().toString().padStart(2, '0');

  return {
    date: minAllowedTime,
    time: `${hours}:${minutes}`
  };
}
