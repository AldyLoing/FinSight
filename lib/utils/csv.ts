export function arrayToCsv(data: any[], headers?: string[]): string {
  if (data.length === 0) return '';

  const columnHeaders = headers || Object.keys(data[0]);
  const csvHeaders = columnHeaders.join(',');

  const csvRows = data.map(row => {
    return columnHeaders.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

export function downloadCsv(data: any[], filename: string, headers?: string[]): void {
  const csv = arrayToCsv(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
