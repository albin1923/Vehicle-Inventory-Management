export const formatCurrency = (amount?: number | string | null): string => {
  if (amount === undefined || amount === null) {
    return "INR 0";
  }

  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) {
    return "INR 0";
  }

  return `INR ${value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (isoDate?: string | null): string => {
  if (!isoDate) {
    return "-";
  }

  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

export const formatDateTime = (isoDate?: string | null): string => {
  if (!isoDate) {
    return "-";
  }

  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};
