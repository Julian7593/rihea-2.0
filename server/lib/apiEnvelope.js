export function sendSuccess(res, req, data, { status = 200, code = "OK", message = "success" } = {}) {
  return res.status(status).json({
    code,
    message,
    requestId: req.requestId,
    data,
  });
}

export function sendError(res, req, error) {
  const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
  const code = typeof error?.code === "string" ? error.code : "INTERNAL_SERVER_ERROR";
  const message = typeof error?.message === "string" && error.message ? error.message : "Internal server error";

  return res.status(status).json({
    code,
    message,
    requestId: req.requestId,
    data: null,
  });
}

export function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
