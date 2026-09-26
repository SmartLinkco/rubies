import type { NextFunction, Request, Response } from "express";
import type { ApiErrorBody } from "@rubies/shared";

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "NOT_FOUND", "Route not found"));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    res.status(err.status).json(body);
    return;
  }

  console.error(err);
  const body: ApiErrorBody = {
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    },
  };
  res.status(500).json(body);
}
