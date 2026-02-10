export const pick = (obj, allowedFields) => {
  if (!obj || typeof obj !== "object") return {};
  return allowedFields.reduce((acc, field) => {
    if (obj[field] !== undefined) {
      acc[field] = obj[field];
    }
    return acc;
  }, {});
};
