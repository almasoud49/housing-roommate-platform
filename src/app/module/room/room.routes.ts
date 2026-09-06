import { Router } from "express";
import { RoomController } from "./room.controller";
import { RoomValidation } from "./room.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { checkPermission } from "../../middleware/checkPermission";

const router = Router();

router.post(
	"/",
	auth("LANDLORD"),
	validateRequest(RoomValidation.createRoomSchema),
	RoomController.createRoom,
);
router.get(
	"/",
	auth(),
	validateRequest(RoomValidation.roomFiltersSchema),
	RoomController.getRooms,
);
router.get(
	"/my-rooms",
	auth("LANDLORD"),
	validateRequest(RoomValidation.roomFiltersSchema),
	RoomController.getMyRooms,
);
router.get("/:id", auth(), RoomController.getRoomById);
router.patch(
	"/:id",
	auth("LANDLORD"),
	checkPermission("update", "room"),
	validateRequest(RoomValidation.updateRoomSchema),
	RoomController.updateRoom,
);
router.delete(
	"/:id",
	auth("LANDLORD"),
	checkPermission("delete", "room"),
	RoomController.deleteRoom,
);

export const RoomRoutes = router;
