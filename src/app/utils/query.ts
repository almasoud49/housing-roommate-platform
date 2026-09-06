export const buildPagination = (page = 1, limit = 10) => ({
	skip: (page - 1) * limit,
	take: limit,
});

export const buildOrderBy = (
	sortBy = "createdAt",
	sortOrder: "asc" | "desc" = "desc",
) => ({
	[sortBy]: sortOrder,
});

export const buildMeta = (page: number, limit: number, total: number) => ({
	page,
	limit,
	total,
	totalPages: Math.ceil(total / limit),
});

export const buildSearchConditions = <T extends string>(
	search: string | undefined,
	fields: T[],
	mode: "insensitive" | "default" = "insensitive",
) => {
	if (!search) return undefined;
	const conditions = fields.map((field) => ({
		[field]: { contains: search, mode },
	}));
	return { OR: conditions };
};

export const applyFilters = <T extends Record<string, unknown>>(
	baseConditions: T[],
	filters: Record<string, unknown>,
): T[] => {
	const conditions = [...baseConditions];

	Object.entries(filters).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			conditions.push({ [key]: value } as T);
		}
	});

	return conditions;
};

export const buildDateRangeFilter = (
	field: string,
	from?: string | Date,
	to?: string | Date,
) => {
	const conditions: Record<string, { gte?: Date; lte?: Date }> = {};

	if (from) {
		conditions[field] = {
			...conditions[field],
			gte: from instanceof Date ? from : new Date(from),
		};
	}

	if (to) {
		conditions[field] = {
			...conditions[field],
			lte: to instanceof Date ? to : new Date(to),
		};
	}

	if (Object.keys(conditions).length === 1) return conditions[field];
	if (Object.keys(conditions).length > 1)
		return { AND: Object.values(conditions) };
	return {};
};

export const buildNumberRangeFilter = (
	field: string,
	min?: number,
	max?: number,
) => {
	const conditions: Record<string, { gte?: number; lte?: number }> = {};

	if (min !== undefined) {
		conditions[field] = { ...conditions[field], gte: min };
	}

	if (max !== undefined) {
		conditions[field] = { ...conditions[field], lte: max };
	}

	if (Object.keys(conditions).length === 1) return conditions[field];
	if (Object.keys(conditions).length > 1)
		return { AND: Object.values(conditions) };
	return {};
};
