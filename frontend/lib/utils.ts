import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Gujarat: '#c0392b',
    Ahmedabad: '#c0392b',
    Rajkot: '#c0392b',
    Surat: '#c0392b',
    Vadodara: '#c0392b',
    Crime: '#8e44ad',
    Politics: '#2980b9',
    Business: '#16a085',
    Sports: '#e67e22',
    Entertainment: '#d35400',
    Technology: '#2471a3',
    Lifestyle: '#1abc9c',
    Education: '#27ae60',
    World: '#7f8c8d',
    'Gujarat Election 2027': '#c0392b',
  };
  return colors[category] || '#c0392b';
}
