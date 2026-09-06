export interface AppErrorDetails {
	field?: string;
	code?: string;
	message: string;
}

export class AppError extends Error {
	public statusCode: number;
	public errorCode: string;
	public details: AppErrorDetails[];

	constructor(
		statusCode: number,
		message: string,
		errorCode = "ERROR",
		details: AppErrorDetails[] = [],
		stack = "",
	) {
		super(message);

		this.statusCode = statusCode;
		this.errorCode = errorCode;
		this.details = details;

		if (stack) {
			this.stack = stack;
		} else {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}
