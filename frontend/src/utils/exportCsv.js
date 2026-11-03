/**
 * Export JSON array to a downloaded CSV file in browser
 * @param {Array<Object>} data
 * @param {string} filename
 * @param {Array<{key: string, label: string}>} columns
 */
export const exportToCSV = (data, filename = 'assetflow-export.csv', columns = []) => {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  const headers = columns.length > 0 ? columns.map(c => c.label) : Object.keys(data[0]);
  const keys = columns.length > 0 ? columns.map(c => c.key) : Object.keys(data[0]);

  const csvRows = [];
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

  for (const row of data) {
    const values = keys.map(key => {
      let val = row;
      // Support dot notation like 'assignedEmployee.name'
      if (key.includes('.')) {
        const parts = key.split('.');
        val = parts.reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : ''), row);
      } else {
        val = row[key];
      }
      if (val === null || val === undefined) val = '';
      if (val instanceof Date) val = val.toISOString().split('T')[0];
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
