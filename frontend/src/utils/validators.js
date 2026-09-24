export const validatePhone = (phone) => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const validatePosterForm = (values) => {
  const errors = {};
  if (!values.title || values.title.trim().length < 3 || values.title.trim().length > 120) {
    errors.title = 'Title must be between 3 and 120 characters';
  }
  if (!values.category) {
    errors.category = 'Category is required';
  }
  if (!values.language) {
    errors.language = 'Language is required';
  }
  if (!values.aspectRatio) {
    errors.aspectRatio = 'Aspect ratio is required';
  }
  return errors;
};

export const validateCategoryForm = (values) => {
  const errors = {};
  if (!values.name || values.name.trim().length < 2 || values.name.trim().length > 50) {
    errors.name = 'Category name must be between 2 and 50 characters';
  }
  return errors;
};
