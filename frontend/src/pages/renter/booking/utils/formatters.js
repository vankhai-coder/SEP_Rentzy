// Format helpers
export const formatCurrency = (amount) => 
  new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(amount || 0);

export const formatDateTime = (dateString, timeString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString('vi-VN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  return timeString ? `${dateStr} ${timeString}` : dateStr;
};

export const formatCountdownTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};