export const sendSuccess = (
  res,
  { data = null, message = "OK", status = 200 } = {}
) => {
  return res.status(status).json({ success: true, message, data });
};

export const sendCreated = (res, data, message = "Created") => {
  return sendSuccess(res, { data, message, status: 201 });
};

export const sendError = (
  res,
  { status = 400, message = "Bad Request" } = {}
) => {
  return res.status(status).json({ success: false, message });
};
