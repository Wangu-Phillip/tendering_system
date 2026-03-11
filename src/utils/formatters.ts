export const formatCurrency = (amount: number, currency: string = 'BWP'): string => {
  return new Intl.NumberFormat('en-BW', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date: Date | string | undefined | null, format: 'short' | 'long' = 'short'): string => {
  if (!date) {
    return 'N/A';
  }
  
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    console.warn('Invalid date provided:', date);
    return 'Invalid date';
  }
  
  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

export const formatDateTime = (date: Date | string | undefined | null): string => {
  if (!date) {
    return 'N/A';
  }
  
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    console.warn('Invalid date provided:', date);
    return 'Invalid date';
  }
  
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusBadgeColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-800',
    'closing_soon': 'bg-yellow-100 text-yellow-800',
    closed: 'bg-red-100 text-red-800',
    awarded: 'bg-blue-100 text-blue-800',
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    evaluated: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

export const getDaysUntil = (date: Date | string): number => {
  const d = new Date(date);
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
