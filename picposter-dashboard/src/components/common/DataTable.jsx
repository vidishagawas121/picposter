import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';

export const DataTable = ({
  columns = [],
  rows = [],
  loading = false,
  page = 1,
  limit = 20,
  totalCount = 0,
  onPageChange,
  onLimitChange,
  emptyMessage = 'No records found',
  renderRow,
}) => {
  return (
    <Paper
      sx={{
        width: '100%',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 3.5,
        backgroundColor: '#111827',
      }}
    >
      <TableContainer sx={{ minHeight: 320, maxHeight: 680 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id || col.label}
                  align={col.align || 'left'}
                  sx={{ width: col.width, minWidth: col.minWidth }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={36} color="primary" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading data...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) =>
                renderRow ? (
                  renderRow(row, index)
                ) : (
                  <TableRow key={row._id || row.id || index} hover>
                    {columns.map((col) => (
                      <TableCell key={col.id} align={col.align || 'left'}>
                        {col.render ? col.render(row) : row[col.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalCount > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page - 1}
          rowsPerPage={limit}
          onPageChange={(_, newPage) => onPageChange && onPageChange(newPage + 1)}
          onRowsPerPageChange={(e) => onLimitChange && onLimitChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 20, 50, 100]}
          sx={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'text.secondary',
          }}
        />
      )}
    </Paper>
  );
};

export default DataTable;
