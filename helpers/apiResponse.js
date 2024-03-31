const successResponse = function (res, msg) {
	const data = {
		status: 1,
		message: msg
	};
	return res.status(200).json(data);
};

const successResponseWithData = function (res, msg, data) {
	const resData = {
		status: 1,
		message: msg,
		data: data
	};
	return res.status(200).json(resData);
};

const errorResponse = function (res, msg) {
	const data = {
		status: 0,
		message: msg,
	};
	return res.status(500).json(data);
};

const notFoundResponse = function (res, msg) {
	const data = {
		status: 0,
		message: msg,
	};
	return res.status(404).json(data);
};

const validationErrorWithData = function (res, msg, data) {
	const resData = {
		status: 0,
		message: msg,
		data: data
	};
	return res.status(400).json(resData);
};

const unauthorizedResponse = function (res, msg) {
	const data = {
		status: 0,
		message: msg,
	};
	return res.status(401).json(data);
};

export default {
	successResponse,
	successResponseWithData,
	errorResponse,
	notFoundResponse,
	validationErrorWithData,
	unauthorizedResponse
}