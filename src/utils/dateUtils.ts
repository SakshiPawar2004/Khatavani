/**
 * Utility functions for date formatting
 */

/**
 * Formats a date to DD/MM/YY format (e.g., 01/02/25)
 * @param date - Date object or date string
 * @returns Formatted date string in DD/MM/YY format
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear().toString().slice(-2);
  
  return `${day}/${month}/${year}`;
};

/**
 * Formats a date for use in filenames (DD-MM-YY format)
 * @param date - Date object or date string
 * @returns Formatted date string in DD-MM-YY format
 */
export const formatDateForFilename = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear().toString().slice(-2);
  
  return `${day}-${month}-${year}`;
};
