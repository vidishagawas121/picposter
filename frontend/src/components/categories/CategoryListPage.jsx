import React, { useState, useEffect } from 'react';
import { categoryApi } from '../../api/categoryApi';
import CategoryFormModal from './CategoryFormModal';
import ConfirmDialog from '../common/ConfirmDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Typography,
  Button,
  Avatar,
  IconButton,
  Switch,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  AddRounded,
  EditRounded,
  DeleteOutlineRounded,
  DragIndicatorRounded,
  CategoryRounded,
} from '@mui/icons-material';

// Sortable Row Component
const SortableCategoryRow = ({
  category,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id || category._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
  };

  return (
    <TableRow ref={setNodeRef} style={style} hover>
      <TableCell sx={{ width: 40 }}>
        <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab' }}>
          <DragIndicatorRounded sx={{ color: 'text.disabled' }} />
        </IconButton>
      </TableCell>

      <TableCell sx={{ width: 60 }}>
        <Avatar
          src={category.iconUrl}
          alt={category.name}
          variant="rounded"
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <CategoryRounded sx={{ fontSize: 20, color: 'primary.light' }} />
        </Avatar>
      </TableCell>

      <TableCell>
        <Typography variant="subtitle2" fontWeight={700}>
          {category.name}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" color="text.secondary" fontFamily="monospace">
          {category.slug}
        </Typography>
      </TableCell>

      <TableCell align="center">
        <Chip
          label={`#${category.sortOrder}`}
          size="small"
          variant="outlined"
          sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
        />
      </TableCell>

      <TableCell align="center">
        <Chip
          label={`${category.posterCount || 0} Posters`}
          size="small"
          color={category.posterCount > 0 ? 'primary' : 'default'}
          sx={{ height: 24, fontWeight: 700 }}
        />
      </TableCell>

      <TableCell align="center">
        <Switch
          size="small"
          checked={category.isActive}
          onChange={(e) => onToggleStatus(category, e)}
          color="success"
        />
      </TableCell>

      <TableCell align="right">
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Edit Category">
            <IconButton size="small" color="primary" onClick={() => onEdit(category)}>
              <EditRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Category">
            <IconButton size="small" color="error" onClick={() => onDelete(category)}>
              <DeleteOutlineRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export const CategoryListPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await categoryApi.getCategories();
      if (res.data?.data) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to retrieve categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex((cat) => (cat.id || cat._id) === active.id);
      const newIndex = categories.findIndex((cat) => (cat.id || cat._id) === over.id);

      const reordered = arrayMove(categories, oldIndex, newIndex).map((cat, idx) => ({
        ...cat,
        sortOrder: idx + 1,
      }));

      setCategories(reordered);

      try {
        const payload = reordered.map((cat, idx) => ({
          id: cat.id || cat._id,
          sortOrder: idx + 1,
        }));
        await categoryApi.reorderCategories(payload);
      } catch (err) {
        console.error('Failed to save category order:', err);
        fetchCategories(); // Revert on failure
      }
    }
  };

  const handleToggleStatus = async (cat, e) => {
    e.stopPropagation();
    try {
      const newStatus = !cat.isActive;
      await categoryApi.updateCategoryStatus(cat.id || cat._id, newStatus);
      setCategories((prev) =>
        prev.map((c) =>
          (c.id === cat.id || c._id === cat._id) ? { ...c, isActive: newStatus } : c
        )
      );
    } catch (err) {
      console.error('Failed to toggle category status:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      setActionLoading(true);
      setError('');
      await categoryApi.deleteCategory(categoryToDelete.id || categoryToDelete._id);
      setDeleteOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete category');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} className="gradient-text">
            Category Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organize poster categories and drag to reorder carousel rankings
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddRounded />}
          onClick={() => {
            setSelectedCategory(null);
            setFormOpen(true);
          }}
          sx={{ py: 1.2, px: 2.5 }}
        >
          Add New Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Category Drag and Drop Table */}
      <Paper
        sx={{
          width: '100%',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 3.5,
          backgroundColor: '#111827',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }}></TableCell>
                <TableCell sx={{ width: 60 }}>Icon</TableCell>
                <TableCell>Category Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell align="center">Sort Order</TableCell>
                <TableCell align="center">Linked Posters</TableCell>
                <TableCell align="center">Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} color="primary" />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      Loading categories...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      No categories created yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={categories.map((c) => c.id || c._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {categories.map((cat) => (
                      <SortableCategoryRow
                        key={cat.id || cat._id}
                        category={cat}
                        onEdit={(c) => {
                          setSelectedCategory(c);
                          setFormOpen(true);
                        }}
                        onDelete={(c) => {
                          setCategoryToDelete(c);
                          setDeleteOpen(true);
                        }}
                        onToggleStatus={handleToggleStatus}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modals */}
      <CategoryFormModal
        open={formOpen}
        category={selectedCategory}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchCategories}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Category"
        message={
          categoryToDelete?.posterCount > 0
            ? `Warning: Category "${categoryToDelete?.name}" has ${categoryToDelete?.posterCount} poster(s) linked to it. The system will prevent deletion until posters are reassigned or removed.`
            : `Are you sure you want to delete category "${categoryToDelete?.name}"?`
        }
        confirmText="Delete Category"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteOpen(false);
          setCategoryToDelete(null);
        }}
      />
    </Box>
  );
};

export default CategoryListPage;
