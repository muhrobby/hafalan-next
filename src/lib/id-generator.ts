const padNumber = (value: number, length: number) =>
  value.toString().padStart(length, "0");

const formatDateYYMMDD = (date?: Date) => {
  const target = date ?? new Date();
  const year = target.getFullYear() % 100;
  const month = target.getMonth() + 1;
  const day = target.getDate();
  return `${padNumber(year, 2)}${padNumber(month, 2)}${padNumber(day, 2)}`;
};

const randomDigits = (length: number) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

export const generateNIS = (date?: Date) => {
  return `${formatDateYYMMDD(date)}${randomDigits(6)}`;
};

export const generateNIP = (date?: Date) => {
  return `000${formatDateYYMMDD(date)}${randomDigits(3)}`;
};

export const generatePlaceholderEmail = (prefix: string) => {
  const safePrefix = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  return `${safePrefix || "santri"}-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}@noemail.hafalan.local`;
};
