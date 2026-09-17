-- CreateIndex
CREATE INDEX "Application_tenantId_idx" ON "Application"("tenantId");

-- CreateIndex
CREATE INDEX "Application_roomId_idx" ON "Application"("roomId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Building_propertyId_idx" ON "Building"("propertyId");

-- CreateIndex
CREATE INDEX "Building_city_idx" ON "Building"("city");

-- CreateIndex
CREATE INDEX "Building_deletedAt_idx" ON "Building"("deletedAt");

-- CreateIndex
CREATE INDEX "Flat_buildingId_idx" ON "Flat"("buildingId");

-- CreateIndex
CREATE INDEX "Flat_floor_idx" ON "Flat"("floor");

-- CreateIndex
CREATE INDEX "Flat_deletedAt_idx" ON "Flat"("deletedAt");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_tenantId_idx" ON "MaintenanceRequest"("tenantId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_roomId_idx" ON "MaintenanceRequest"("roomId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_status_idx" ON "MaintenanceRequest"("status");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_priority_idx" ON "MaintenanceRequest"("priority");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_category_idx" ON "MaintenanceRequest"("category");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_assignedTo_idx" ON "MaintenanceRequest"("assignedTo");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_createdAt_idx" ON "MaintenanceRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_bkashPaymentId_idx" ON "Payment"("bkashPaymentId");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Property_landlordId_idx" ON "Property"("landlordId");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Property_deletedAt_idx" ON "Property"("deletedAt");

-- CreateIndex
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");

-- CreateIndex
CREATE INDEX "PropertyViewingRequest_tenantId_idx" ON "PropertyViewingRequest"("tenantId");

-- CreateIndex
CREATE INDEX "PropertyViewingRequest_roomId_idx" ON "PropertyViewingRequest"("roomId");

-- CreateIndex
CREATE INDEX "PropertyViewingRequest_status_idx" ON "PropertyViewingRequest"("status");

-- CreateIndex
CREATE INDEX "PropertyViewingRequest_preferredDate_idx" ON "PropertyViewingRequest"("preferredDate");

-- CreateIndex
CREATE INDEX "PropertyViewingRequest_createdAt_idx" ON "PropertyViewingRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Rent_tenantId_idx" ON "Rent"("tenantId");

-- CreateIndex
CREATE INDEX "Rent_roomId_idx" ON "Rent"("roomId");

-- CreateIndex
CREATE INDEX "Rent_status_idx" ON "Rent"("status");

-- CreateIndex
CREATE INDEX "Rent_dueDate_idx" ON "Rent"("dueDate");

-- CreateIndex
CREATE INDEX "Rent_periodStart_periodEnd_idx" ON "Rent"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "RentalDocument_applicationId_idx" ON "RentalDocument"("applicationId");

-- CreateIndex
CREATE INDEX "RentalDocument_type_idx" ON "RentalDocument"("type");

-- CreateIndex
CREATE INDEX "RentalDocument_status_idx" ON "RentalDocument"("status");

-- CreateIndex
CREATE INDEX "RentalDocument_expiresAt_idx" ON "RentalDocument"("expiresAt");

-- CreateIndex
CREATE INDEX "RentalDocument_createdAt_idx" ON "RentalDocument"("createdAt");

-- CreateIndex
CREATE INDEX "Room_flatId_idx" ON "Room"("flatId");

-- CreateIndex
CREATE INDEX "Room_isActive_idx" ON "Room"("isActive");

-- CreateIndex
CREATE INDEX "Room_price_idx" ON "Room"("price");

-- CreateIndex
CREATE INDEX "Room_availableFrom_idx" ON "Room"("availableFrom");

-- CreateIndex
CREATE INDEX "Room_availableTo_idx" ON "Room"("availableTo");

-- CreateIndex
CREATE INDEX "Room_createdAt_idx" ON "Room"("createdAt");

-- CreateIndex
CREATE INDEX "RoommateMatch_tenantId_idx" ON "RoommateMatch"("tenantId");

-- CreateIndex
CREATE INDEX "RoommateMatch_matchedWithId_idx" ON "RoommateMatch"("matchedWithId");

-- CreateIndex
CREATE INDEX "RoommateMatch_roomId_idx" ON "RoommateMatch"("roomId");

-- CreateIndex
CREATE INDEX "RoommateMatch_status_idx" ON "RoommateMatch"("status");

-- CreateIndex
CREATE INDEX "RoommateMatch_score_idx" ON "RoommateMatch"("score");

-- CreateIndex
CREATE INDEX "RoommateMatch_createdAt_idx" ON "RoommateMatch"("createdAt");

-- CreateIndex
CREATE INDEX "RoommatePreference_budgetMin_budgetMax_idx" ON "RoommatePreference"("budgetMin", "budgetMax");

-- CreateIndex
CREATE INDEX "RoommatePreference_lifestyle_idx" ON "RoommatePreference"("lifestyle");

-- CreateIndex
CREATE INDEX "RoommatePreference_smokingAllowed_idx" ON "RoommatePreference"("smokingAllowed");

-- CreateIndex
CREATE INDEX "RoommatePreference_petsAllowed_idx" ON "RoommatePreference"("petsAllowed");

-- CreateIndex
CREATE INDEX "RoommatePreference_moveInDate_idx" ON "RoommatePreference"("moveInDate");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_isVerified_idx" ON "User"("isVerified");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "UtilityBill_roomId_idx" ON "UtilityBill"("roomId");

-- CreateIndex
CREATE INDEX "UtilityBill_type_idx" ON "UtilityBill"("type");

-- CreateIndex
CREATE INDEX "UtilityBill_status_idx" ON "UtilityBill"("status");

-- CreateIndex
CREATE INDEX "UtilityBill_billingPeriod_idx" ON "UtilityBill"("billingPeriod");

-- CreateIndex
CREATE INDEX "UtilityBill_dueDate_idx" ON "UtilityBill"("dueDate");

-- CreateIndex
CREATE INDEX "UtilityBill_createdAt_idx" ON "UtilityBill"("createdAt");

-- CreateIndex
CREATE INDEX "UtilityBillSplit_tenantId_idx" ON "UtilityBillSplit"("tenantId");

-- CreateIndex
CREATE INDEX "UtilityBillSplit_status_idx" ON "UtilityBillSplit"("status");
