import { Router } from "express";
import { RoomController } from "./room.controller";
import { RoomValidation } from "./room.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { checkPermission } from "../../middleware/checkPermission";

const router = Router();

router.post(
	"/",
	auth("LANDLORD", "ADMIN"),
	validateRequest(RoomValidation.createRoomSchema),
	RoomController.createRoom,
);
router.get(
	"/",
	auth(),
	validateRequest(RoomValidation.roomFiltersSchema, "query"),
	RoomController.getRooms,
);
router.get(
	"/my-rooms",
	auth("LANDLORD"),
	validateRequest(RoomValidation.roomFiltersSchema, "query"),
	RoomController.getMyRooms,
);
router.get("/:id", auth(), RoomController.getRoomById);
router.patch(
	"/:id",
	auth("LANDLORD", "ADMIN"),
	checkPermission("update", "room"),
	validateRequest(RoomValidation.updateRoomSchema),
	RoomController.updateRoom,
);
router.delete(
	"/:id",
	auth("LANDLORD", "ADMIN"),
	checkPermission("delete", "room"),
	RoomController.deleteRoom,
);

export const RoomRoutes = router;
