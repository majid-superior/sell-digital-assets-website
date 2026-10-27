// src/features/dashboard/pages/seller/SellerUsersPage.tsx
import React from "react";
import { MembersPage } from "./MembersPage.tsx";

/**
 * @deprecated Legacy component retained for backward compatibility.
 * Prefer importing MembersPage, RolesPage, or PermissionsPage directly.
 */
export const SellerUsersPage: React.FC = () => {
  return <MembersPage />;
};

export default SellerUsersPage;
