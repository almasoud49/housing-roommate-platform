import type { Prisma } from "../../generated/prisma/client";

export const propertyWithBuildingsInclude: Prisma.PropertyInclude = {
	buildings: {
		select: {
			id: true,
			name: true,
			address: true,
			city: true,
			floors: true,
			deletedAt: true,
			flats: {
				select: {
					id: true,
					flatNumber: true,
					floor: true,
					deletedAt: true,
					rooms: {
						select: {
							id: true,
							name: true,
							price: true,
							isActive: true,
							availableFrom: true,
							availableTo: true,
						},
					},
				},
			},
		},
	},
};

export const buildingWithFlatsInclude: Prisma.BuildingInclude = {
	flats: {
		select: {
			id: true,
			flatNumber: true,
			floor: true,
			deletedAt: true,
			rooms: {
				select: {
					id: true,
					name: true,
					price: true,
					isActive: true,
					availableFrom: true,
					availableTo: true,
				},
			},
		},
	},
};

export const flatWithRoomsInclude: Prisma.FlatInclude = {
	rooms: {
		select: {
			id: true,
			name: true,
			price: true,
			isActive: true,
			availableFrom: true,
			availableTo: true,
		},
	},
};

export const roomWithFlatBuildingPropertyInclude: Prisma.RoomInclude = {
	flat: {
		select: {
			id: true,
			flatNumber: true,
			floor: true,
			building: {
				select: {
					id: true,
					name: true,
					address: true,
					city: true,
					property: {
						select: { id: true, title: true, landlordId: true },
					},
				},
			},
		},
	},
};

export const applicationWithTenantAndRoomInclude: Prisma.ApplicationInclude = {
	tenant: {
		select: {
			id: true,
			name: true,
			email: true,
			profile: {
				select: {
					phoneNumber: true,
					bio: true,
					avatarUrl: true,
				},
			},
		},
	},
	room: {
		include: {
			flat: {
				include: {
					building: {
						include: {
							property: {
								select: {
									id: true,
									title: true,
									address: true,
									city: true,
									landlordId: true,
								},
							},
						},
					},
				},
			},
		},
	},
};
