import type { Response } from "express";
import httpStatus from "http-status";

type TMeta = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
};

type TResponseData<T> = {
	success: boolean;
	statusCode: number;
	message: string;
	data: T;
	meta?: TMeta;
};

export const sendResponse = <T>(res: Response, data: TResponseData<T>) => {
	res.status(data.statusCode).json({
		success: data.success,
		statusCode: data.statusCode,
		message: data.message,
		data: data.data,
		meta: data.meta,
	});
};

// Shorthand helpers so controllers don't repeat the response envelope.
export const sendOk = <T>(res: Response, message: string, data: T) => {
	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message,
		data,
	});
};

export const sendCreated = <T>(res: Response, message: string, data: T) => {
	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message,
		data,
	});
};

export const sendPaginated = <T>(
	res: Response,
	message: string,
	data: T,
	meta: TMeta,
) => {
	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message,
		data,
		meta,
	});
};

export const sendForbidden = (res: Response, message: string) => {
	sendResponse(res, {
		success: false,
		statusCode: httpStatus.FORBIDDEN,
		message,
		data: null,
	});
};

export const sendBadRequest = (res: Response, message: string) => {
	sendResponse(res, {
		success: false,
		statusCode: httpStatus.BAD_REQUEST,
		message,
		data: null,
	});
};
